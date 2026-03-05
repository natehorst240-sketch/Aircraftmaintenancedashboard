// ADS-B Data Service using OpenSky Network API (Free)
// Documentation: https://openskynetwork.github.io/opensky-api/

export interface ADSBStateVector {
  icao24: string; // Unique ICAO 24-bit address
  callsign: string | null; // Callsign (tail number)
  origin_country: string;
  time_position: number | null; // Unix timestamp
  last_contact: number; // Unix timestamp
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null; // Barometric altitude in meters
  on_ground: boolean;
  velocity: number | null; // Ground speed in m/s
  true_track: number | null; // Heading in degrees
  vertical_rate: number | null; // m/s
  sensors: number[] | null;
  geo_altitude: number | null; // Geometric altitude in meters
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

export interface ADSBResponse {
  time: number;
  states: ADSBStateVector[] | null;
}

export interface ProcessedAircraftData {
  icao24: string;
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number; // feet
  heading: number;
  speed: number; // knots
  onGround: boolean;
  lastUpdate: string;
  country: string;
}

// Your aircraft ICAO codes (these need to be looked up)
// Note: ICAO codes are hex addresses assigned to each aircraft
// You can look these up at: https://registry.faa.gov/aircraftinquiry/
const AIRCRAFT_REGISTRATIONS = [
  'N291HC',
  'N431HC',
  'N531HC',
  'N281HC'
];

// Convert meters to feet
const metersToFeet = (meters: number): number => {
  return Math.round(meters * 3.28084);
};

// Convert m/s to knots
const msToKnots = (ms: number): number => {
  return Math.round(ms * 1.94384);
};

/**
 * Fetch all aircraft states from OpenSky Network
 * Free API with rate limits: 
 * - Anonymous: 10 calls per minute, 400 calls per day
 * - Registered: 100 calls per minute, 4000 calls per day
 */
export async function fetchAllAircraftStates(): Promise<ADSBResponse> {
  try {
    const response = await fetch(
      'https://opensky-network.org/api/states/all',
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenSky API error: ${response.status}`);
    }

    const data: ADSBResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ADS-B data:', error);
    throw error;
  }
}

/**
 * Fetch aircraft by callsign/registration
 * Note: OpenSky API doesn't support direct callsign filtering in free tier
 * We need to fetch all and filter, or use bounding box
 */
export async function fetchAircraftByBoundingBox(
  minLat: number,
  minLon: number,
  maxLat: number,
  maxLon: number
): Promise<ADSBResponse> {
  try {
    const url = `https://opensky-network.org/api/states/all?lamin=${minLat}&lomin=${minLon}&lamax=${maxLat}&lomax=${maxLon}`;
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenSky API error: ${response.status}`);
    }

    const data: ADSBResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ADS-B data:', error);
    throw error;
  }
}

/**
 * Process raw ADS-B data into our application format
 */
export function processADSBData(states: ADSBStateVector[]): ProcessedAircraftData[] {
  return states
    .filter(state => {
      // Filter out invalid positions and data
      return state.latitude !== null && 
             state.longitude !== null && 
             state.callsign !== null &&
             state.last_contact !== null &&
             state.last_contact > 0;
    })
    .map(state => {
      const callsign = (state.callsign || '').trim().toUpperCase();
      const altitude = state.baro_altitude !== null 
        ? metersToFeet(state.baro_altitude) 
        : (state.geo_altitude !== null ? metersToFeet(state.geo_altitude) : 0);
      const speed = state.velocity !== null ? msToKnots(state.velocity) : 0;
      const heading = state.true_track !== null ? Math.round(state.true_track) : 0;

      // Safely create date with validation
      let lastUpdate: string;
      try {
        const timestamp = state.last_contact * 1000;
        if (isNaN(timestamp) || timestamp <= 0) {
          lastUpdate = new Date().toISOString();
        } else {
          lastUpdate = new Date(timestamp).toISOString();
        }
      } catch (error) {
        console.warn('Invalid timestamp for aircraft:', state.icao24, error);
        lastUpdate = new Date().toISOString();
      }

      return {
        icao24: state.icao24,
        callsign,
        latitude: state.latitude!,
        longitude: state.longitude!,
        altitude,
        heading,
        speed,
        onGround: state.on_ground,
        lastUpdate,
        country: state.origin_country,
      };
    });
}

/**
 * Filter for specific aircraft registrations
 */
export function filterByRegistrations(
  aircraft: ProcessedAircraftData[],
  registrations: string[]
): ProcessedAircraftData[] {
  const upperRegistrations = registrations.map(r => r.trim().toUpperCase());
  return aircraft.filter(ac => 
    upperRegistrations.some(reg => ac.callsign.includes(reg))
  );
}

/**
 * Main function to fetch your fleet's live data
 * Uses bounding box for Utah area to reduce API calls
 */
export async function fetchFleetLiveData(): Promise<ProcessedAircraftData[]> {
  try {
    // Utah bounding box (covers entire state)
    const minLat = 37.0;  // Southern Utah border
    const minLon = -114.0; // Western Utah border
    const maxLat = 42.0;   // Northern Utah border
    const maxLon = -109.0; // Eastern Utah border

    console.log('Fetching ADS-B data from OpenSky Network (Utah region)...');
    const response = await fetchAircraftByBoundingBox(minLat, minLon, maxLat, maxLon);
    
    if (!response || !response.states) {
      console.warn('No aircraft data received from OpenSky Network');
      return [];
    }

    console.log(`Received ${response.states.length} aircraft from OpenSky API`);
    
    const processed = processADSBData(response.states);
    const fleetData = filterByRegistrations(processed, AIRCRAFT_REGISTRATIONS);

    console.log(`Processed ${processed.length} aircraft, found ${fleetData.length} from your fleet`);
    
    if (fleetData.length > 0) {
      console.log('Fleet aircraft found:', fleetData.map(a => a.callsign));
    } else {
      console.log('No fleet aircraft currently transmitting ADS-B in Utah');
    }
    
    return fleetData;
  } catch (error) {
    console.error('Failed to fetch fleet live data:', error);
    // Return empty array instead of throwing to prevent UI errors
    return [];
  }
}

/**
 * Alternative: ADS-B Exchange via RapidAPI (requires free API key)
 * Sign up at: https://rapidapi.com/adsbx/api/adsbexchange-com1
 */
export async function fetchFromADSBExchange(
  apiKey: string,
  registration: string
): Promise<any> {
  try {
    const response = await fetch(
      `https://adsbexchange-com1.p.rapidapi.com/v2/registration/${registration}/`,
      {
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`ADS-B Exchange API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from ADS-B Exchange:', error);
    throw error;
  }
}

/**
 * FAA Registry lookup to get ICAO 24-bit address from N-number
 * This is helpful for tracking aircraft more reliably
 */
export async function lookupICAOFromNNumber(nNumber: string): Promise<string | null> {
  try {
    // Using a CORS proxy for demonstration
    // In production, you'd want to do this server-side or use a proper API
    const response = await fetch(
      `https://registry.faa.gov/AircraftInquiry/Search/NNumberResult?nNumberTxt=${nNumber}`
    );
    
    // Note: This would require HTML parsing
    // Better to use a proper API or maintain a manual mapping
    console.warn('ICAO lookup requires server-side processing or manual mapping');
    return null;
  } catch (error) {
    console.error('Error looking up ICAO:', error);
    return null;
  }
}
