export interface Aircraft {
  id: string;
  registration: string;
  totalTime: number;
  hoursUntil200Hr: number;
  averageUtilization: number;
  location?: AircraftLocation;
  status: "in-flight" | "on-ground" | "maintenance";
  isLive?: boolean;
}

export interface AircraftLocation {
  latitude: number;
  longitude: number;
  altitude: number;
  heading: number;
  speed: number;
  lastUpdate: string;
}

export interface InspectionHours {
  aircraftId: string;
  registration: string;
  inspections: {
    [key: string]: number;
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
