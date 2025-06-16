
import { addConfirmation, RotaConfirmation } from '@/utils/rotaStore';

export interface RotaConfirmRequest {
  guardId: string;
  guardName: string;
  date: string;
  shiftId: string;
  confirmed: boolean;
}

export interface RotaConfirmResponse {
  status: 'ok' | 'error';
  message?: string;
  timestamp: string;
  confirmation?: RotaConfirmation;
}

// Simulate API endpoint for confirming shifts
export const confirmShift = async (request: RotaConfirmRequest): Promise<RotaConfirmResponse> => {
  try {
    // Validate the request
    if (!request.guardId || !request.date || !request.shiftId) {
      return {
        status: 'error',
        message: 'Missing required fields',
        timestamp: new Date().toISOString()
      };
    }

    // Add the confirmation
    const confirmation = addConfirmation(request);

    console.log(`Shift ${request.confirmed ? 'confirmed' : 'declined'} by ${request.guardName} for ${request.date}`);

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      confirmation
    };
  } catch (error) {
    console.error('Error confirming shift:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
};
