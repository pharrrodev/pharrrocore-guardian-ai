
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

    // Use direct SQL insert since RPC function types aren't available
    const { data, error } = await supabase
      .from('radio_handover_logs' as any)
      .insert([logEntry])
      .select('id, created_at')
      .single() as { data: { id?: string; created_at?: string } | null, error: any };

    if (error) {
      console.error('Error logging radio/handover to Supabase:', error);
      return {
        status: 'error',
        message: error.message || 'Failed to log entry to Supabase'
      };
    }

    return {
      status: 'ok',
      timestamp: data?.created_at,
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
