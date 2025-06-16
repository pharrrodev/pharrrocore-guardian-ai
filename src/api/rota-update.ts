
import { Shift } from '@/data/rota-data';
import { saveRotaData } from '@/utils/rotaStore';

export interface RotaUpdateRequest {
  rows: Shift[];
}

export interface RotaUpdateResponse {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
}

// Simulate API endpoint for updating rota data
export const updateRotaData = async (request: RotaUpdateRequest): Promise<RotaUpdateResponse> => {
  try {
    // Validate the data
    if (!request.rows || !Array.isArray(request.rows)) {
      return {
        status: 'error',
        message: 'Invalid rota data format',
        timestamp: new Date().toISOString()
      };
    }

    // Save the updated rota data
    saveRotaData(request.rows);

    console.log(`Rota updated with ${request.rows.length} shifts`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error updating rota:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};
