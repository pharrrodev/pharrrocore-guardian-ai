
import { isTimeInRange, getTimeLeftInBreak, formatTimeRemaining, getTimeUntilBreak } from '../utils/timeHelpers';
import { supabase } from '@/integrations/supabase/client';

// Interface for shift data that we expect from the database
interface ShiftData {
  id: string;
  start_time: string;
  end_time: string;
  position: string;
  break_times?: Array<{ breakStart: string; breakEnd: string; breakType?: string }>;
}

export interface BreakCheckRequest {
  guardId?: string | null;
  guardName: string;
  date: string;
  currentTime: string;
}

export interface BreakCheckResponse {
  onBreak: boolean;
  message: string;
  shift_id_checked: string | null;
  nextBreak?: {
    startTime: string;
    endTime: string;
    position?: string;
  };
  currentShift?: {
    id: string;
    startTime: string;
    endTime: string;
    position?: string;
  };
}

export const checkBreakStatus = async (request: BreakCheckRequest): Promise<BreakCheckResponse> => {
  const { guardId, guardName, date, currentTime } = request;
  let currentShiftData: ShiftData | null = null;
  
  try {
    // Use direct SQL query since RPC function types aren't available
    const { data: shiftsData, error: dbError } = await supabase
      .from('shifts' as any)
      .select('id, start_time, end_time, position, break_times')
      .or(`guard_id.eq.${guardId},guard_name.eq.${guardName}`)
      .eq('shift_date', date) as { data: ShiftData[] | null, error: any };

    if (dbError) {
      console.error('Supabase error fetching shifts:', dbError);
      // If the RPC doesn't exist, fall back to a simpler response
      return {
        onBreak: false,
        message: `Unable to check break status for ${guardName} on ${date}. Shift data not available.`,
        shift_id_checked: null,
      };
    }

    if (!shiftsData || shiftsData.length === 0) {
      return {
        onBreak: false,
        message: `No shift found for ${guardName} on ${date}.`,
        shift_id_checked: null,
      };
    }

    // Find the shift that is active at 'currentTime'
    currentShiftData = shiftsData.find((s: ShiftData) =>
        isTimeInRange(currentTime, s.start_time, s.end_time) ||
        (shiftsData.length === 1)
    ) as ShiftData | null;

    if (!currentShiftData && shiftsData.length > 0) {
        currentShiftData = shiftsData[0] as ShiftData;
    }

    if (!currentShiftData) {
         return {
            onBreak: false,
            message: `No active shift found for ${guardName} at ${currentTime} on ${date}.`,
            shift_id_checked: null,
        };
    }

    const mappedCurrentShiftInfo = {
        id: currentShiftData.id,
        startTime: currentShiftData.start_time,
        endTime: currentShiftData.end_time,
        position: currentShiftData.position,
    };

    if (!currentShiftData.break_times || currentShiftData.break_times.length === 0) {
      return {
        onBreak: false,
        message: "No break times scheduled for this shift.",
        shift_id_checked: currentShiftData.id,
        currentShift: mappedCurrentShiftInfo,
      };
    }

    for (const breakTime of currentShiftData.break_times) {
      if (isTimeInRange(currentTime, breakTime.breakStart, breakTime.breakEnd)) {
        const timeLeft = getTimeLeftInBreak(currentTime, breakTime.breakEnd);
        return {
          onBreak: true,
          message: `On ${breakTime.breakType?.toLowerCase() || 'break'} until ${breakTime.breakEnd} (${formatTimeRemaining(timeLeft)} left).`,
          shift_id_checked: currentShiftData.id,
          currentShift: mappedCurrentShiftInfo,
        };
      }
    }

    const futureBreaks = currentShiftData.break_times
      .filter(breakTime => breakTime.breakStart > currentTime)
      .sort((a, b) => a.breakStart.localeCompare(b.breakStart));

    if (futureBreaks.length > 0) {
      const nextBreak = futureBreaks[0];
      const timeUntil = getTimeUntilBreak(currentTime, nextBreak.breakStart);
      return {
        onBreak: false,
        message: `Next ${nextBreak.breakType?.toLowerCase() || 'break'} at ${nextBreak.breakStart}-${nextBreak.breakEnd} (in ${formatTimeRemaining(timeUntil)}).`,
        shift_id_checked: currentShiftData.id,
        nextBreak: { startTime: nextBreak.breakStart, endTime: nextBreak.breakEnd, position: currentShiftData.position },
        currentShift: mappedCurrentShiftInfo,
      };
    }

    return {
      onBreak: false,
      message: "No more breaks scheduled for this shift.",
      shift_id_checked: currentShiftData.id,
      currentShift: mappedCurrentShiftInfo,
    };

  } catch (error) {
    console.error('Error in checkBreakStatus:', error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return {
      onBreak: false,
      message: `Error checking break status: ${errorMessage}. Please check connection or guard details.`,
      shift_id_checked: currentShiftData?.id || null,
    };
  }
};
