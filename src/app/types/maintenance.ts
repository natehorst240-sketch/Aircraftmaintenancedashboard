export interface Aircraft {
  id: string;
  tailNumber: string;
  model: string;
  status: string;
  totalHours: number;
  nextInspection: string;
}

export interface InspectionHours {
  aircraftId: string;
  inspectionType: string;
  hoursRemaining: number;
  dueAtHours: number;
  currentHours: number;
  status: string;
}

export interface AircraftComponents {
  aircraftId: string;
  componentName: string;
  partNumber: string;
  serialNumber: string;
  hoursRemaining: number;
  status: string;
}
