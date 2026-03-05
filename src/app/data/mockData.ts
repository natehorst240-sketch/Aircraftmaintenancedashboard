// Mock data structure that would come from your Python script JSON output

export interface Aircraft {
  id: string;
  registration: string;
  totalTime: number;
  hoursUntil200Hr: number;
  averageUtilization: number; // hours per day
  location?: AircraftLocation; // Real-time GPS location
  status: "in-flight" | "on-ground" | "maintenance";
  isLive?: boolean; // Flag to indicate if data is from live ADS-B
}

export interface AircraftLocation {
  latitude: number;
  longitude: number;
  altitude: number; // in feet
  heading: number; // degrees
  speed: number; // knots
  lastUpdate: string; // ISO timestamp
}

export interface InspectionHours {
  aircraftId: string;
  registration: string;
  inspections: {
    [key: string]: number; // inspection name -> hours remaining
  };
}

export interface Component {
  id: string;
  name: string;
  serialNumber: string;
  hoursRemaining: number;
  dueDate?: string;
}

export interface AircraftComponents {
  aircraftId: string;
  registration: string;
  components: Component[];
}

export interface CalendarEvent {
  id: string;
  aircraftId: string;
  registration: string;
  inspectionType: string;
  dueDate: string;
  hoursRemaining: number;
  notes?: string;
}

// Your actual fleet aircraft with placeholder data
// Live ADS-B data will update locations when available
export const aircraftData: Aircraft[] = [
  {
    id: "AC001",
    registration: "N291HC",
    totalTime: 4850,
    hoursUntil200Hr: 150,
    averageUtilization: 4.2,
    status: "on-ground",
    location: {
      latitude: 40.7884, // Ogden, Utah
      longitude: -111.9780,
      altitude: 0,
      heading: 0,
      speed: 0,
      lastUpdate: new Date().toISOString(),
    },
  },
  {
    id: "AC002",
    registration: "N431HC",
    totalTime: 3920,
    hoursUntil200Hr: 80,
    averageUtilization: 5.1,
    status: "on-ground",
    location: {
      latitude: 40.7608, // Salt Lake City, Utah
      longitude: -111.8910,
      altitude: 0,
      heading: 0,
      speed: 0,
      lastUpdate: new Date().toISOString(),
    },
  },
  {
    id: "AC003",
    registration: "N531HC",
    totalTime: 5140,
    hoursUntil200Hr: 60,
    averageUtilization: 3.8,
    status: "on-ground",
    location: {
      latitude: 40.2200, // Provo, Utah
      longitude: -111.6630,
      altitude: 0,
      heading: 0,
      speed: 0,
      lastUpdate: new Date().toISOString(),
    },
  },
  {
    id: "AC004",
    registration: "N281HC",
    totalTime: 6275,
    hoursUntil200Hr: 125,
    averageUtilization: 4.5,
    status: "on-ground",
    location: {
      latitude: 40.5900, // Bountiful, Utah
      longitude: -111.8805,
      altitude: 0,
      heading: 0,
      speed: 0,
      lastUpdate: new Date().toISOString(),
    },
  },
];

// Mock inspection hours data
export const inspectionHoursData: InspectionHours[] = [
  {
    aircraftId: "AC001",
    registration: "N291HC",
    inspections: {
      "Annual Inspection": 450,
      "100 Hour": 50,
      "Transponder Check": 320,
      "ELT Inspection": 680,
      "Pitot-Static": 890,
    },
  },
  {
    aircraftId: "AC002",
    registration: "N431HC",
    inspections: {
      "Annual Inspection": 220,
      "100 Hour": 20,
      "Transponder Check": 180,
      "ELT Inspection": 420,
      "Pitot-Static": 620,
    },
  },
  {
    aircraftId: "AC003",
    registration: "N531HC",
    inspections: {
      "Annual Inspection": 140,
      "100 Hour": 40,
      "Transponder Check": 95,
      "ELT Inspection": 340,
      "Pitot-Static": 540,
    },
  },
  {
    aircraftId: "AC004",
    registration: "N281HC",
    inspections: {
      "Annual Inspection": 325,
      "100 Hour": 25,
      "Transponder Check": 245,
      "ELT Inspection": 525,
      "Pitot-Static": 725,
    },
  },
];

// Mock components data - showing components due within next 200 hours
export const componentsData: AircraftComponents[] = [
  {
    aircraftId: "AC001",
    registration: "N291HC",
    components: [
      {
        id: "C001",
        name: "Oil Filter",
        serialNumber: "OF-12345",
        hoursRemaining: 50,
      },
      {
        id: "C002",
        name: "Spark Plugs",
        serialNumber: "SP-67890",
        hoursRemaining: 150,
      },
      {
        id: "C003",
        name: "Fuel Filter",
        serialNumber: "FF-11223",
        hoursRemaining: 180,
      },
    ],
  },
  {
    aircraftId: "AC002",
    registration: "N431HC",
    components: [
      {
        id: "C004",
        name: "Oil Filter",
        serialNumber: "OF-22334",
        hoursRemaining: 20,
      },
      {
        id: "C005",
        name: "Battery",
        serialNumber: "BT-44556",
        hoursRemaining: 80,
      },
      {
        id: "C006",
        name: "Brake Pads",
        serialNumber: "BP-77889",
        hoursRemaining: 120,
      },
      {
        id: "C007",
        name: "Spark Plugs",
        serialNumber: "SP-99001",
        hoursRemaining: 160,
      },
    ],
  },
  {
    aircraftId: "AC003",
    registration: "N531HC",
    components: [
      {
        id: "C008",
        name: "Fuel Filter",
        serialNumber: "FF-33445",
        hoursRemaining: 40,
      },
      {
        id: "C009",
        name: "Oil Filter",
        serialNumber: "OF-55667",
        hoursRemaining: 60,
      },
      {
        id: "C010",
        name: "Vacuum Pump",
        serialNumber: "VP-88990",
        hoursRemaining: 95,
      },
      {
        id: "C011",
        name: "Alternator Belt",
        serialNumber: "AB-11223",
        hoursRemaining: 140,
      },
      {
        id: "C012",
        name: "Spark Plugs",
        serialNumber: "SP-44556",
        hoursRemaining: 180,
      },
    ],
  },
  {
    aircraftId: "AC004",
    registration: "N281HC",
    components: [
      {
        id: "C013",
        name: "Oil Filter",
        serialNumber: "OF-66778",
        hoursRemaining: 25,
      },
      {
        id: "C014",
        name: "Fuel Filter",
        serialNumber: "FF-99001",
        hoursRemaining: 125,
      },
      {
        id: "C015",
        name: "Tire Replacement",
        serialNumber: "TR-22334",
        hoursRemaining: 170,
      },
    ],
  },
];

// Helper function to calculate projected due date
export function calculateDueDate(
  hoursRemaining: number,
  avgUtilization: number
): string {
  const daysUntilDue = Math.ceil(hoursRemaining / avgUtilization);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysUntilDue);
  return dueDate.toISOString().split("T")[0];
}

// Mock calendar events - generated from inspection and component data
export const generateCalendarEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  let eventId = 1;

  // Generate events from inspection data
  inspectionHoursData.forEach((aircraft) => {
    const aircraftInfo = aircraftData.find((a) => a.id === aircraft.aircraftId);
    if (!aircraftInfo) return;

    Object.entries(aircraft.inspections).forEach(([inspection, hours]) => {
      events.push({
        id: `E${eventId++}`,
        aircraftId: aircraft.aircraftId,
        registration: aircraft.registration,
        inspectionType: inspection,
        dueDate: calculateDueDate(hours, aircraftInfo.averageUtilization),
        hoursRemaining: hours,
      });
    });
  });

  return events;
};
