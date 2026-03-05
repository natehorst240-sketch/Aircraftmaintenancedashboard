import { useState, useEffect } from 'react';
import { loadMaintenanceData } from '../services/maintenanceDataService';
import { 
  aircraftData as mockAircraftData, 
  inspectionHoursData as mockInspectionData,
  componentsData as mockComponentsData,
  Aircraft,
  InspectionHours,
  AircraftComponents
} from '../data/mockData';

interface MaintenanceDataState {
  aircraft: Aircraft[];
  inspections: InspectionHours[];
  components: AircraftComponents[];
  isLoading: boolean;
  error: string | null;
  isUsingMockData: boolean;
  lastUpdated: Date | null;
}

/**
 * Hook to load maintenance data from FlightDocs CSV or fall back to mock data
 * 
 * Data is refreshed:
 * - On component mount
 * - Every 5 minutes (in case CSV is updated)
 * - When manually triggered via refresh function
 */
export function useMaintenanceData() {
  const [state, setState] = useState<MaintenanceDataState>({
    aircraft: mockAircraftData,
    inspections: mockInspectionData,
    components: mockComponentsData,
    isLoading: true,
    error: null,
    isUsingMockData: true,
    lastUpdated: null,
  });

  const loadData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await loadMaintenanceData();

      // If we got data, use it; otherwise fall back to mock data
      if (data.aircraft.length > 0) {
        setState({
          aircraft: data.aircraft,
          inspections: data.inspections,
          components: data.components,
          isLoading: false,
          error: null,
          isUsingMockData: false,
          lastUpdated: new Date(),
        });
      } else {
        // No data from CSV, use mock data
        setState({
          aircraft: mockAircraftData,
          inspections: mockInspectionData,
          components: mockComponentsData,
          isLoading: false,
          error: null,
          isUsingMockData: true,
          lastUpdated: null,
        });
      }
    } catch (error) {
      console.error('Failed to load maintenance data:', error);
      // On error, fall back to mock data
      setState({
        aircraft: mockAircraftData,
        inspections: mockInspectionData,
        components: mockComponentsData,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
        isUsingMockData: true,
        lastUpdated: null,
      });
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();

    // Refresh data every 5 minutes to pick up CSV updates
    const interval = setInterval(loadData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    refresh: loadData,
  };
}
