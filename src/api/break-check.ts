
import { getCurrentTime, getCurrentDate, isTimeInRange, getTimeUntilBreak, getTimeLeftInBreak, formatTimeRemaining } from '../utils/timeHelpers';
import { rotaData, getGuardShifts } from '../data/rota-data';

export interface BreakCheckRequest {
  guardId: string;
}

export interface BreakCheckResponse {
  reply: string;
  onBreak: boolean;
  nextBreakTime?: string;
  timeUntilNext?: string;
}

export const checkBreakStatus = (guardId: string): BreakCheckResponse => {
  const today = getCurrentDate();
  const currentTime = getCurrentTime();
  
  // Find current shift for the guard
  const todayShifts = rotaData.filter(shift => 
    shift.guardId === guardId && shift.date === today
  );
  
  if (todayShifts.length === 0) {
    return {
      reply: "No shift found for today.",
      onBreak: false
    };
  }
  
  const currentShift = todayShifts[0]; // Assuming one shift per day per guard
  
  // Check if currently on break
  for (const breakTime of currentShift.breakTimes) {
    if (isTimeInRange(currentTime, breakTime.breakStart, breakTime.breakEnd)) {
      const timeLeft = getTimeLeftInBreak(currentTime, breakTime.breakEnd);
      return {
        reply: `You're on ${breakTime.breakType.toLowerCase()} break until ${breakTime.breakEnd} (${formatTimeRemaining(timeLeft)} left).`,
        onBreak: true
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
      reply: `Next ${nextBreak.breakType.toLowerCase()} break ${nextBreak.breakStart}-${nextBreak.breakEnd} (in ${formatTimeRemaining(timeUntil)}).`,
      onBreak: false,
      nextBreakTime: `${nextBreak.breakStart}-${nextBreak.breakEnd}`,
      timeUntilNext: formatTimeRemaining(timeUntil)
    };
  }
  
  return {
    reply: "No more breaks scheduled for today.",
    onBreak: false
  };
};

// Log break queries (in a real app, this would write to a file)
export const logBreakQuery = (guardId: string, result: string): void => {
  const timestamp = new Date().toISOString();
  console.log(`Break Query Log: ${guardId},${timestamp},${result}`);
  // In a real implementation, this would append to logs/breakQueries.csv
};
