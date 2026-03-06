import { useState, useEffect } from 'react';
import { loadMaintenanceData } from '../services/maintenanceDataService';
import type {
  Aircraft,
  InspectionHours,
  AircraftComponents,
} from '../types/maintenance';

interface MaintenanceDataState {
  aircraft: Aircraft[];
  inspections: InspectionHours[];
  components: AircraftComponents[];
  isLoading: boolean;
  error: string | null;
  isUsingMockData: boolean;
  lastUpdated: Date | null;
}

export function useMaintenanceData() {
  const [state, setState] = useState<MaintenanceDataState>({
    aircraft: [],
    inspections: [],
    components: [],
    isLoading: true,
    error: null,
    isUsingMockData: false,
    lastUpdated: null,
  });

  const loadData = async () => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
    }));

    try {
      const data = await loadMaintenanceData();

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
        setState({
          aircraft: [],
          inspections: [],
          components: [],
          isLoading: false,
          error: 'CSV loaded but returned no aircraft records',
          isUsingMockData: false,
          lastUpdated: null,
        });
      }
    } catch (error) {
      console.error('Failed to load maintenance data:', error);

      setState({
        aircraft: [],
        inspections: [],
        components: [],
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load data',
        isUsingMockData: false,
        lastUpdated: null,
      });
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return {
    ...state,
    refresh: loadData,
  };
}
