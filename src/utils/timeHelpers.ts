
import dayjs from 'dayjs';

export const getCurrentTime = (): string => {
  return dayjs().format('HH:mm');
};

export const getCurrentDate = (): string => {
  return dayjs().format('YYYY-MM-DD');
};

export const isTimeInRange = (currentTime: string, startTime: string, endTime: string): boolean => {
  const current = dayjs(`2000-01-01 ${currentTime}`);
  const start = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);
  
  return current.isAfter(start) && current.isBefore(end) || current.isSame(start) || current.isSame(end);
};

export const getTimeUntilBreak = (currentTime: string, breakTime: string): number => {
  const current = dayjs(`2000-01-01 ${currentTime}`);
  const breakStart = dayjs(`2000-01-01 ${breakTime}`);
  
  return breakStart.diff(current, 'minute');
};

export const getTimeLeftInBreak = (currentTime: string, breakEndTime: string): number => {
  const current = dayjs(`2000-01-01 ${currentTime}`);
  const breakEnd = dayjs(`2000-01-01 ${breakEndTime}`);
  
  return breakEnd.diff(current, 'minute');
};

export const formatTimeRemaining = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
};
