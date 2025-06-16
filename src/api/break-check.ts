
import { getCurrentTime, getCurrentDate, isTimeInRange, getTimeUntilBreak, getTimeLeftInBreak, formatTimeRemaining } from '../utils/timeHelpers';
import { loadRotaData } from '../utils/rotaStore';

export interface BreakCheckRequest {
  guardName: string;
  date: string;
  currentTime: string;
}

export interface BreakCheckResponse {
  onBreak: boolean;
  message: string;
  nextBreak?: {
    startTime: string;
    endTime: string;
    position?: string;
  };
  currentShift?: {
    startTime: string;
    endTime: string;
    position?: string;
  };
}

export const checkBreakStatus = async (request: BreakCheckRequest): Promise<BreakCheckResponse> => {
  const { guardName, date, currentTime } = request;
  
  // Load rota data from storage
  const rotaData = loadRotaData();
  
  // Find shifts for the guard on the specified date
  const todayShifts = rotaData.filter(shift => 
    shift.guardName.toLowerCase().includes(guardName.toLowerCase()) && 
    shift.date === date
  );
  
  if (todayShifts.length === 0) {
    return {
      onBreak: false,
      message: "No shift found for this guard on the specified date."
    };
  }
  
  const currentShift = todayShifts[0]; // Assuming one shift per day per guard
  
  // Check if guard has break times defined
  if (!currentShift.breakTimes || currentShift.breakTimes.length === 0) {
    return {
      onBreak: false,
      message: "No break times scheduled for this shift.",
      currentShift: {
        startTime: currentShift.startTime,
        endTime: currentShift.endTime,
        position: currentShift.position
      }
    };
  }
  
  // Check if currently on break
  for (const breakTime of currentShift.breakTimes) {
    if (isTimeInRange(currentTime, breakTime.breakStart, breakTime.breakEnd)) {
      const timeLeft = getTimeLeftInBreak(currentTime, breakTime.breakEnd);
      return {
        onBreak: true,
        message: `You're on ${breakTime.breakType.toLowerCase()} break until ${breakTime.breakEnd} (${formatTimeRemaining(timeLeft)} left).`,
        currentShift: {
          startTime: currentShift.startTime,
          endTime: currentShift.endTime,
          position: currentShift.position
        }
      };
    }
  }
  
  // Find next break
  const futureBreaks = currentShift.breakTimes.filter(breakTime => {
    const breakStart = `2000-01-01 ${breakTime.breakStart}`;
    const current = `2000-01-01 ${currentTime}`;
    return breakStart > current;
  });
  
  if (futureBreaks.length > 0) {
    const nextBreak = futureBreaks[0];
    const timeUntil = getTimeUntilBreak(currentTime, nextBreak.breakStart);
    
    return {
      onBreak: false,
      message: `Next ${nextBreak.breakType.toLowerCase()} break ${nextBreak.breakStart}-${nextBreak.breakEnd} (in ${formatTimeRemaining(timeUntil)}).`,
      nextBreak: {
        startTime: nextBreak.breakStart,
        endTime: nextBreak.breakEnd,
        position: currentShift.position
      },
      currentShift: {
        startTime: currentShift.startTime,
        endTime: currentShift.endTime,
        position: currentShift.position
      }
    };
  }
  
  return {
    onBreak: false,
    message: "No more breaks scheduled for today.",
    currentShift: {
      startTime: currentShift.startTime,
      endTime: currentShift.endTime,
      position: currentShift.position
    }
  };
};

// Log break queries (in a real app, this would write to a file)
export const logBreakQuery = (guardName: string, result: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`Break Query Log: ${guardName},${timestamp},${result}`);
  // In a real implementation, this would append to logs/breakQueries.csv
};
