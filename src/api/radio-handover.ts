
import { appendCsvLine, RadioHandoverLogEntry } from '../utils/appendCsv';
import { guards } from '../data/rota-data';

export interface RadioHandoverRequest {
  guardId: string;
  action: 'radio' | 'handover';
}

export interface RadioHandoverResponse {
  status: 'ok' | 'error';
  timestamp?: string;
  message?: string;
}

export const logRadioHandover = (request: RadioHandoverRequest): RadioHandoverResponse => {
  try {
    // Find guard name
    const guard = guards.find(g => g.id === request.guardId);
    if (!guard) {
      return {
        status: 'error',
        message: 'Guard not found'
      };
    }

    // Append to CSV log
    const entry = appendCsvLine('logs/radioHandover.csv', {
      guardId: request.guardId,
      guardName: guard.name,
      action: request.action
    });

    return {
      status: 'ok',
      timestamp: entry.timestamp
    };
  } catch (error) {
    console.error('Error logging radio/handover:', error);
    return {
      status: 'error',
      message: 'Failed to log entry'
    };
  }
};
