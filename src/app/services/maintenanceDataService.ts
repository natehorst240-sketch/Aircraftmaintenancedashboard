import { Aircraft, InspectionHours, AircraftComponents, Component } from '../data/mockData';

// ── Phase inspection intervals to track (hours) ───────────────────────────────
const TARGET_INTERVALS = [50, 100, 200, 400, 800, 2400, 3200];

// Map each interval to regex pattern(s) found in Column F (ATA and Code)
const PHASE_MATCH: Record<number, RegExp[]> = {
  // Some exports may omit remaining-hours on 05 1000 rows for specific tails.
  // Include the paired 62 MI62-01 inspection as a fallback 50-hour signal.
  50:   [/05 1000/, /62 MI62-01/],
  100:  [/64 01\[273\]/],
  200:  [/05 1005/],
  400:  [/05 1010/],
  800:  [/05 1015/],
  2400: [/62 11\[373\]/],
  3200: [/05 1020/],
};

// Component panel: show items within this many hours of retire/overhaul
const COMPONENT_WINDOW_HRS = 200;

// Keywords that identify retirement/overhaul component items
const RETIREMENT_KEYWORDS = [
  'RETIRE', 'OVERHAUL', 'DISCARD', 'LIFE LIMIT', 'TBO',
  'REPLACEMENT', 'REPLACE', 'CHANGE OIL', 'NOZZLE',
];

// ── Column indices (0-based) ──────────────────────────────────────────────────
const COL_REG          = 0;
const COL_AIRFRAME_HRS = 3;
const COL_ATA          = 5;
// COL_ITEM_TYPE = 11 (reserved for future use)
const COL_DESC         = 15;
const COL_SERIAL       = 18; // Serial Number
const COL_NEXT_DUE     = 40; // Next Due Date (used for calendar events)
const COL_REM_HRS      = 54;
// COL_STATUS = 63 (reserved for future use)

// ── Display labels for each phase interval ────────────────────────────────────
export const PHASE_LABELS: Record<number, string> = {
  50:   '50 Hr',
  100:  '100 Hr',
  200:  '200 Hr',
  400:  '400 Hr',
  800:  '800 Hr',
  2400: '2,400 Hr',
  3200: '3,200 Hr',
};

/** All phase inspection type names in order — use as column headers. */
export const PHASE_INSPECTION_TYPES = TARGET_INTERVALS.map(i => PHASE_LABELS[i]);

// ── CSV Parsing ───────────────────────────────────────────────────────────────

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Parse CSV text into raw rows (header row is skipped).
 * Returns an array of string arrays, each being one row of values.
 */
function parseRawCsv(csvText: string): string[][] {
  const lines = csvText
    .trim()
    .split('\n')
    .map(line => line.replace(/\r$/, ''));

  if (lines.length < 2) return [];

  // index 0 is the header — skip it
  const result: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    if (values.some(v => v.length > 0)) {
      result.push(values);
    }
  }
  return result;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isRetirementItem(desc: string): boolean {
  const upper = desc.toUpperCase();
  return RETIREMENT_KEYWORDS.some(kw => upper.includes(kw));
}

// ── Transform ─────────────────────────────────────────────────────────────────

function transformRawCsvData(rows: string[][]): {
  aircraft: Aircraft[];
  inspections: InspectionHours[];
  components: AircraftComponents[];
} {
  // Group rows by registration
  const byAircraft = new Map<string, string[][]>();

  for (const row of rows) {
    const reg = row[COL_REG]?.trim();
    if (!reg) continue;
    if (!byAircraft.has(reg)) byAircraft.set(reg, []);
    byAircraft.get(reg)!.push(row);
  }

  const aircraft: Aircraft[] = [];
  const inspections: InspectionHours[] = [];
  const components: AircraftComponents[] = [];

  let aircraftIndex = 0;

  for (const [registration, acRows] of byAircraft) {
    const aircraftId = `AC${String(++aircraftIndex).padStart(3, '0')}`;

    // Airframe hours — take the max value across all rows for this aircraft
    let airframeHrs = 0;
    for (const row of acRows) {
      const h = parseFloat(row[COL_AIRFRAME_HRS]);
      if (!isNaN(h) && h > airframeHrs) airframeHrs = h;
    }

    // ── Phase inspections ────────────────────────────────────────────────────
    const phaseInspections: { [key: string]: number } = {};

    for (const interval of TARGET_INTERVALS) {
      const patterns = PHASE_MATCH[interval];
      const label = PHASE_LABELS[interval];

      for (const row of acRows) {
        const ata = row[COL_ATA]?.trim() || '';
        if (!patterns.some(p => p.test(ata))) continue;

        const remHrs = parseFloat(row[COL_REM_HRS]);
        if (isNaN(remHrs)) continue;

        // If multiple rows match for the same interval, keep the minimum
        // (most-urgent reading wins)
        if (!(label in phaseInspections) || remHrs < phaseInspections[label]) {
          phaseInspections[label] = remHrs;
        }
      }
    }

    // hoursUntil200Hr: use the 200 Hr phase remaining hours when available,
    // otherwise fall back to a modular calculation
    const hoursUntil200Hr =
      phaseInspections[PHASE_LABELS[200]] ?? (200 - (airframeHrs % 200));

    aircraft.push({
      id: aircraftId,
      registration,
      totalTime: airframeHrs,
      hoursUntil200Hr,
      averageUtilization: 4.5, // default — would need historical data
      status: 'on-ground',
    });

    if (Object.keys(phaseInspections).length > 0) {
      inspections.push({
        aircraftId,
        registration,
        inspections: phaseInspections,
      });
    }

    // ── Component items ──────────────────────────────────────────────────────
    const componentItems: Component[] = [];

    for (const row of acRows) {
      const desc = row[COL_DESC]?.trim() || '';
      if (!isRetirementItem(desc)) continue;

      const remHrs = parseFloat(row[COL_REM_HRS]);
      // Only include items that have an hours-based limit within the window
      if (isNaN(remHrs) || remHrs > COMPONENT_WINDOW_HRS) continue;

      componentItems.push({
        id: `${aircraftId}-comp-${componentItems.length + 1}`,
        name: desc,
        serialNumber: row[COL_SERIAL]?.trim() || 'N/A',
        hoursRemaining: remHrs,
        dueDate: row[COL_NEXT_DUE]?.trim() || undefined,
      });
    }

    if (componentItems.length > 0) {
      components.push({ aircraftId, registration, components: componentItems });
    }
  }

  return { aircraft, inspections, components };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Fetch and parse the FlightDocs CSV from /data/due-list.csv.
 * Returns empty arrays on failure (caller falls back to mock data).
 */
export async function loadMaintenanceData(): Promise<{
  aircraft: Aircraft[];
  inspections: InspectionHours[];
  components: AircraftComponents[];
}> {
  try {
    const response = await fetch('/data/due-list.csv');

    if (!response.ok) {
      console.warn(
        'CSV file not found, falling back to mock data. ' +
        'Run the FlightDocs scraper to populate real data.'
      );
      throw new Error('CSV not found');
    }

    const csvText = await response.text();
    const rawRows = parseRawCsv(csvText);

    if (rawRows.length === 0) {
      throw new Error('CSV has no data rows');
    }

    return transformRawCsvData(rawRows);
  } catch (error) {
    console.error('Error loading maintenance data:', error);
    return { aircraft: [], inspections: [], components: [] };
  }
}
