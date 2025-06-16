
import dayjs from 'dayjs';
import { appendVisitorLog, updateVisitorDeparture } from '@/utils/csvHelpers';

export interface VisitorLogRequest {
  visitorName: string;
  company: string;
  escort: string;
  mode: 'in' | 'out';
  photo?: File;
}

export interface VisitorLogResponse {
  status: 'ok' | 'error';
  message?: string;
  data?: any;
}

export const submitVisitorLog = async (request: VisitorLogRequest): Promise<VisitorLogResponse> => {
  try {
    const { visitorName, company, escort, mode, photo } = request;
    
    if (!visitorName.trim()) {
      return { status: 'error', message: 'Visitor name is required' };
    }
    
    if (mode === 'in') {
      // Handle visitor check-in
      const id = Date.now().toString();
      const arrivalTime = dayjs().toISOString();
      
      let photoPath = '';
      
      // Handle photo upload if provided
      if (photo) {
        if (photo.size > 2 * 1024 * 1024) {
          return { status: 'error', message: 'Photo size must be less than 2MB' };
        }
        
        const datePrefix = dayjs().format('YYYYMMDD');
        photoPath = `/visitorPhotos/${datePrefix}-${id}.jpg`;
        
        // In a real implementation, you would save the file here
        // For this demo, we'll just store the path
      }
      
      const entry = appendVisitorLog({
        id,
        visitorName,
        company,
        escort,
        arrivalTime,
        photoPath
      });
      
      return { 
        status: 'ok', 
        message: `${visitorName} checked in successfully`,
        data: entry 
      };
      
    } else if (mode === 'out') {
      // Handle visitor check-out
      const departureTime = dayjs().toISOString();
      
      const updatedEntry = updateVisitorDeparture(visitorName, departureTime);
      
      if (!updatedEntry) {
        return { 
          status: 'error', 
          message: `No active check-in found for ${visitorName}` 
        };
      }
      
      return { 
        status: 'ok', 
        message: `${visitorName} checked out successfully`,
        data: updatedEntry 
      };
    }
    
    return { status: 'error', message: 'Invalid mode specified' };
    
  } catch (error) {
    console.error('Visitor log error:', error);
    return { status: 'error', message: 'Failed to process visitor log entry' };
  }
};
