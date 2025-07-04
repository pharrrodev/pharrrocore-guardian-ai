
import { isTimeInRange, getTimeLeftInBreak, formatTimeRemaining, getTimeUntilBreak } from '../utils/timeHelpers'; // Assuming these are still relevant
import { supabase } from '@/integrations/supabase/client'; // Import Supabase client
// Removed: import { loadRotaData } from '../utils/rotaStore';
// Removed: import { getCurrentTime, getCurrentDate } // Not used directly

// Interface for Supabase shift data (subset of what's in shifts table)
interface SupabaseShiftData {
  id: string; // shift_id
  start_time: string; // HH:MM
  end_time: string;   // HH:MM
  position: string;
  break_times?: Array<{ breakStart: string; breakEnd: string; breakType?: string }>; // breakType is optional in provided data
}

export interface BreakCheckRequest {
  guardId?: string | null; // Supabase guard_user_id (UUID)
  guardName: string;      // Name for querying if ID not available, or for display
  date: string;           // YYYY-MM-DD
  currentTime: string;    // HH:MM
}

export interface BreakCheckResponse {
  onBreak: boolean;
  message: string;
  shift_id_checked: string | null; // To log which shift was checked
  nextBreak?: {
    startTime: string;
    endTime: string;
    position?: string;
  };
  currentShift?: {
    id: string; // Shift ID from Supabase
    startTime: string;
    endTime: string;
    position?: string;
  };
}

export const checkBreakStatus = async (request: BreakCheckRequest): Promise<BreakCheckResponse> => {
  const { guardId, guardName, date, currentTime } = request;
  let currentShiftData: SupabaseShiftData | null = null;
  
  try {
    let query = supabase
      .from('shifts')
      .select('id, start_time, end_time, position, break_times')
      .eq('shift_date', date);

    if (guardId) {
      query = query.eq('guard_id', guardId);
    } else {
      // Fallback to name if no ID, less reliable
      query = query.ilike('guard_name', `%${guardName}%`);
    }
    // This query might return multiple shifts if a guard has more than one on a day.
    // We need to find the one that is active at 'currentTime'.
    // For simplicity, we'll take the first result and assume it's the relevant one for now.
    // A more robust solution would filter shifts where currentTime is between start_time and end_time.
    const { data: shiftsData, error: dbError } = await query;

    if (dbError) {
      console.error('Supabase error fetching shifts:', dbError);
      throw dbError; // Propagate error
    }

    if (!shiftsData || shiftsData.length === 0) {
      return {
        onBreak: false,
        message: `No shift found for ${guardName} on ${date}.`,
        shift_id_checked: null,
      };
    }

    // Attempt to find the shift that is active at 'currentTime'
    // This basic logic assumes shifts don't overlap for the same guard on the same day.
    currentShiftData = shiftsData.find(s =>
        isTimeInRange(currentTime, s.start_time, s.end_time) ||
        (shiftsData.length === 1) // If only one shift, use it
    ) as SupabaseShiftData | null;

    if (!currentShiftData && shiftsData.length > 0) {
        // If no shift is strictly "active" at currentTime (e.g. query is for before/after shift)
        // but shifts exist on that day, use the first one for context (e.g. to find next break before shift starts)
        currentShiftData = shiftsData[0] as SupabaseShiftData;
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
      shift_id_checked: currentShiftData?.id || null, // Include shift_id if available even on error
    };
  }
};

// The logBreakQuery function is removed as logging will be handled client-side in BreakChecker.tsx
// after receiving the response, to include both request and response data along with checker's user_id.
