import Papa from 'papaparse';
import type {
  Aircraft,
  InspectionHours,
  AircraftComponents,
  Component,
} from '../types/maintenance';

interface MaintenanceDataResult {
  aircraft: Aircraft[];
  inspections: InspectionHours[];
  components: AircraftComponents[];
}

type CsvRow = Record<string, string>;

function pick(row: CsvRow, keys: string[]): string {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
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

export async function loadMaintenanceData(): Promise<MaintenanceDataResult> {
  const csvUrl = `${import.meta.env.BASE_URL}data/due-list.csv`;

  console.log('Loading maintenance CSV from:', csvUrl);

  const response = await fetch(csvUrl, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
  }

  const csvText = await response.text();

  if (!csvText.trim()) {
    throw new Error('CSV file is empty');
  }

  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  if (parsed.errors.length) {
    console.warn('CSV parse errors:', parsed.errors);
  }

  const rows = parsed.data;
  console.log('Parsed row count:', rows.length);
  console.log('CSV headers:', Object.keys(rows[0] ?? {}));
  console.log('First row:', rows[0]);

  const aircraftMap = new Map<string, Aircraft>();
  const inspectionsMap = new Map<string, InspectionHours>();
  const componentsMap = new Map<string, AircraftComponents>();

  rows.forEach((row, index) => {
    const registration = pick(row, [
      'Registration',
      'Aircraft',
      'A/C',
      'AC',
      'Tail Number',
      'Tail',
      'Aircraft Registration',
    ]);

    if (!registration) {
      return;
    }

    const aircraftId = registration;

    const totalTime = toNumber(
      pick(row, [
        'Total Time',
        'TT',
        'Airframe Time',
        'Current Hours',
        'Total Hours',
      ])
    );

    const hoursUntil200Hr = toNumber(
      pick(row, [
        'Hours Until 200Hr',
        '200 Hour',
        '200 Hr',
        '200HR',
        '200 Hr Remaining',
        'Hours Remaining',
      ])
    );

    const averageUtilization = toNumber(
      pick(row, [
        'Average Utilization',
        'Avg Utilization',
        'Avg. Utilization',
        'Avg Usage',
        'Average Daily Hours',
      ])
    );

    if (!aircraftMap.has(aircraftId)) {
      aircraftMap.set(aircraftId, {
        id: aircraftId,
        registration,
        totalTime,
        hoursUntil200Hr,
        averageUtilization,
        status: 'on-ground',
      });
    }

    const inspectionName = pick(row, [
      'Inspection',
      'Inspection Name',
      'Event',
      'Requirement',
    ]);

    const inspectionHoursRemaining = toNumber(
      pick(row, [
        'Inspection Hours Remaining',
        'Hours Remaining',
        'Remaining Hours',
        'Due In',
      ])
    );

    if (inspectionName) {
      if (!inspectionsMap.has(aircraftId)) {
        inspectionsMap.set(aircraftId, {
          aircraftId,
          registration,
          inspections: {},
        });
      }

      inspectionsMap.get(aircraftId)!.inspections[inspectionName] = inspectionHoursRemaining;
    }

    const componentName = pick(row, [
      'Component',
      'Component Name',
      'Description',
      'Part Description',
      'Item',
    ]);

    const serialNumber = pick(row, [
      'Serial Number',
      'Serial',
      'S/N',
      'SN',
    ]);

    const componentHoursRemaining = toNumber(
      pick(row, [
        'Component Hours Remaining',
        'Hours Remaining',
        'Remaining Hours',
        'Due In',
      ])
    );

    if (componentName) {
      if (!componentsMap.has(aircraftId)) {
        componentsMap.set(aircraftId, {
          aircraftId,
          registration,
          components: [],
        });
      }

      const component: Component = {
        id: makeComponentId(registration, componentName, serialNumber, index),
        name: componentName,
        serialNumber,
        hoursRemaining: componentHoursRemaining,
      };

      componentsMap.get(aircraftId)!.components.push(component);
    }
  });

  return {
    aircraft: Array.from(aircraftMap.values()),
    inspections: Array.from(inspectionsMap.values()),
    components: Array.from(componentsMap.values()),
  };
}
