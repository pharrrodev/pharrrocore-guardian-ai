
import { supabase } from '@/integrations/supabase/client';

export interface RadioHandoverRequest {
  guard_id: string | null;
  guard_name_logged: string;
  action: 'radio' | 'handover';
  user_id_performed_log: string;
  site_id?: string | null;
}

export interface RadioHandoverResponse {
  status: 'ok' | 'error';
  timestamp?: string;
  message?: string;
  logId?: string;
}

export const logRadioHandover = async (request: RadioHandoverRequest): Promise<RadioHandoverResponse> => {
  try {
    const logEntry = {
      guard_id: request.guard_id,
      guard_name_logged: request.guard_name_logged,
      action: request.action,
      user_id_performed_log: request.user_id_performed_log,
      site_id: request.site_id || null,
    };

    // Use RPC function to handle the radio handover logging since the table isn't in our types
    const { data, error } = await supabase
      .rpc('log_radio_handover', {
        p_guard_id: logEntry.guard_id,
        p_guard_name_logged: logEntry.guard_name_logged,
        p_action: logEntry.action,
        p_user_id_performed_log: logEntry.user_id_performed_log,
        p_site_id: logEntry.site_id
      });

    if (error) {
      console.error('Error logging radio/handover to Supabase:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to log entry to Supabase'
      };
    }

    return {
      status: 'ok',
      timestamp: data?.log_timestamp,
      logId: data?.id,
      message: 'Log entry saved successfully.'
    };

  } catch (error) {
    console.error('Unexpected error logging radio/handover:', error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    return {
      status: 'error',
      message: errorMessage
    };
  }
};
