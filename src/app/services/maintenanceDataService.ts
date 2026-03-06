import type {
  Aircraft,
  InspectionHours,
  AircraftComponents,
  Component,
} from '../types/maintenance';


function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        value += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(value.trim());
      value = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(value.trim());
      if (row.some((cellValue) => cellValue !== '')) rows.push(row);
      row = [];
      value = '';
    } else {
      value += char;
    }
  }

  if (value.length > 0 || row.length > 0) {
    row.push(value.trim());
    if (row.some((cellValue) => cellValue !== '')) rows.push(row);
  }

  return rows;
}
interface MaintenanceDataResult {
  aircraft: Aircraft[];
  inspections: InspectionHours[];
  components: AircraftComponents[];
}

const CSV_HEADER_KEY = 'Registration Number';

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/, 1)[0]?.replace(/^\uFEFF/, '').trim() ?? '';
  return firstLine.includes(CSV_HEADER_KEY);
}

async function fetchDueListCsv(): Promise<string> {
  const baseUrl = import.meta.env.BASE_URL || '/';
  const candidates = Array.from(
    new Set([
      `${baseUrl}data/due-list.csv`,
      '/data/due-list.csv',
    ])
  );

  let lastError: Error | null = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url, { cache: 'no-store' });

      if (!response.ok) {
        throw new Error(`Failed to fetch CSV from ${url}: ${response.status} ${response.statusText}`);
      }

      const csvText = await response.text();

      if (!csvText.trim()) {
        throw new Error(`CSV response from ${url} was empty`);
      }

      if (!looksLikeCsv(csvText)) {
        throw new Error(`Response from ${url} was not CSV data`);
      }

      return csvText;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError ?? new Error('Failed to fetch due-list CSV from all known URLs');
}

const TARGET_INTERVALS = [50, 100, 200, 400, 800, 2400, 3200] as const;

const PHASE_MATCH: Record<number, RegExp[]> = {
  50: [new RegExp('05 1000', 'i'), new RegExp('62 MI62-01', 'i')],
  100: [new RegExp('64 01\\[273\\]', 'i')],
  200: [new RegExp('05 1005', 'i')],
  400: [new RegExp('05 1010', 'i')],
  800: [new RegExp('05 1015', 'i')],
  2400: [new RegExp('62 11\\[373\\]', 'i')],
  3200: [new RegExp('05 1020', 'i')],
};

const COMPONENT_WINDOW_HRS = 200;
const RETIREMENT_KEYWORDS = [
  'RETIRE',
  'OVERHAUL',
  'DISCARD',
  'LIFE LIMIT',
  'TBO',
  'REPLACEMENT',
  'REPLACE',
  'CHANGE OIL',
  'NOZZLE',
];

const COL_REG = 0;
const COL_AIRFRAME_RPT = 2;
const COL_AIRFRAME_HRS = 3;
const COL_ATA = 5;
const COL_EQUIP_HRS = 7;
const COL_ITEM_TYPE = 11;
const COL_DISPOSITION = 13;
const COL_DESC = 15;
const COL_INTERVAL_HRS = 30;
const COL_REM_DAYS = 50;
const COL_REM_MONTHS = 52;
const COL_REM_HRS = 54;
const COL_STATUS = 63;

function cell(row: string[], index: number): string {
  const value = row[index];
  return value ? String(value).trim() : '';
}

function toNumber(value: string): number {
  if (!value) return 0;
  const cleaned = String(value).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : 0;
}

function makeComponentId(registration: string, name: string, serial: string, index: number): string {
  return `${registration}-${name || 'component'}-${serial || index}`.replace(/\s+/g, '-');
}

function matchesPhase(ataCode: string, interval: number): boolean {
  return PHASE_MATCH[interval].some((pattern) => pattern.test(ataCode));
}

function isRetirementCandidate(itemType: string, disposition: string, description: string): boolean {
  const haystack = `${itemType} ${disposition} ${description}`.toUpperCase();
  return RETIREMENT_KEYWORDS.some((keyword) => haystack.includes(keyword));
}

function computeAverageUtilization(reportDateRaw: string, remainingHours: number): number {
  const reportDate = new Date(reportDateRaw);
  if (Number.isNaN(reportDate.getTime()) || remainingHours <= 0) {
    return 3;
  }

  const now = new Date();
  const elapsedDays = Math.max((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24), 1);
  const impliedUtilization = remainingHours / elapsedDays;
  return Number.isFinite(impliedUtilization) && impliedUtilization > 0
    ? Math.min(Math.max(impliedUtilization, 0.5), 8)
    : 3;
}

export async function loadMaintenanceData(): Promise<MaintenanceDataResult> {
  const csvText = await fetchDueListCsv();
  if (!csvText.trim()) {
    throw new Error('CSV file is empty');
  }

  const rows = parseCsv(csvText);

  const aircraftMap = new Map<string, Aircraft>();
  const inspectionsMap = new Map<string, InspectionHours>();
  const componentsMap = new Map<string, AircraftComponents>();

  rows.forEach((row, index) => {
    const registration = cell(row, COL_REG);
    if (!registration || registration.toLowerCase() === 'registration') return;

    const ataCode = cell(row, COL_ATA);
    const description = cell(row, COL_DESC);
    const itemType = cell(row, COL_ITEM_TYPE);
    const disposition = cell(row, COL_DISPOSITION);
    const remainingHours = toNumber(cell(row, COL_REM_HRS));
    const totalTime = toNumber(cell(row, COL_AIRFRAME_HRS)) || toNumber(cell(row, COL_EQUIP_HRS));

    if (!aircraftMap.has(registration)) {
      const avgUtilization = computeAverageUtilization(cell(row, COL_AIRFRAME_RPT), remainingHours);
      aircraftMap.set(registration, {
        id: registration,
        registration,
        totalTime,
        hoursUntil200Hr: Number.POSITIVE_INFINITY,
        averageUtilization: avgUtilization,
        status: 'on-ground',
      });
    }

    TARGET_INTERVALS.forEach((interval) => {
      if (!matchesPhase(ataCode, interval)) return;

      if (!inspectionsMap.has(registration)) {
        inspectionsMap.set(registration, {
          aircraftId: registration,
          registration,
          inspections: {},
        });
      }

      const label = `${interval} Hr`;
      const existing = inspectionsMap.get(registration)!.inspections[label];
      if (existing === undefined || remainingHours < existing) {
        inspectionsMap.get(registration)!.inspections[label] = remainingHours;
      }

      const aircraft = aircraftMap.get(registration)!;
      if (interval === 200 && remainingHours >= 0) {
        aircraft.hoursUntil200Hr = Math.min(aircraft.hoursUntil200Hr, remainingHours);
      }
    });

    if (
      isRetirementCandidate(itemType, disposition, description) &&
      remainingHours > 0 &&
      remainingHours <= COMPONENT_WINDOW_HRS
    ) {
      if (!componentsMap.has(registration)) {
        componentsMap.set(registration, {
          aircraftId: registration,
          registration,
          components: [],
        });
      }

      const serialNumber = cell(row, 17) || 'N/A';
      const intervalHours = toNumber(cell(row, COL_INTERVAL_HRS));
      const status = cell(row, COL_STATUS);
      const dueDateLabel = [cell(row, COL_REM_DAYS), cell(row, COL_REM_MONTHS)]
        .filter(Boolean)
        .join(' / ');

      const component: Component = {
        id: makeComponentId(registration, description || ataCode || 'component', serialNumber, index),
        name: description || ataCode || 'Component',
        serialNumber,
        hoursRemaining: remainingHours,
        dueDate: dueDateLabel || status || (intervalHours ? `${intervalHours} hr interval` : undefined),
      };

      componentsMap.get(registration)!.components.push(component);
    }
  });

  const aircraft = Array.from(aircraftMap.values()).map((entry) => ({
    ...entry,
    hoursUntil200Hr: Number.isFinite(entry.hoursUntil200Hr) ? entry.hoursUntil200Hr : 0,
  }));

  return {
    aircraft,
    inspections: Array.from(inspectionsMap.values()),
    components: Array.from(componentsMap.values()),
  };
}
