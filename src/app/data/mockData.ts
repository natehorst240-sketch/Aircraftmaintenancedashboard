import type {
  Aircraft,
  AircraftLocation,
  InspectionHours,
  Component,
  AircraftComponents,
  CalendarEvent,
} from '../types/maintenance';

export type {
  Aircraft,
  AircraftLocation,
  InspectionHours,
  Component,
  AircraftComponents,
  CalendarEvent,
};

// Keep helper if anything still imports it
export function calculateDueDate(
  hoursRemaining: number,
  avgUtilization: number
): string {
  if (!avgUtilization || avgUtilization <= 0) {
    return '';
  }

  const daysUntilDue = Math.ceil(hoursRemaining / avgUtilization);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysUntilDue);
  return dueDate.toISOString().split('T')[0];
}

// Empty placeholders so any old imports stop showing fake data
export const aircraftData: Aircraft[] = [];
export const inspectionHoursData: InspectionHours[] = [];
export const componentsData: AircraftComponents[] = [];

export const generateCalendarEvents = (): CalendarEvent[] => {
  return [];
};
