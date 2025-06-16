
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useSupabaseData = () => {
  const { user } = useAuth();

  // EDOB Functions
  const saveEDOBEntry = async (entry: any) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('edob_entries')
      .insert({
        user_id: user.id,
        entry_type: entry.type,
        details: entry.details,
        patrol_route: entry.route,
        access_type: entry.accessType,
        person_name: entry.personName,
        company: entry.company,
        alarm_zone: entry.alarmZone,
        alarm_type: entry.alarmType,
        timestamp: entry.timestamp
      });

    if (error) {
      console.error('Error saving EDOB entry:', error);
      toast.error('Failed to save EDOB entry');
      return { error };
    }

    toast.success('EDOB entry saved successfully');
    return { error: null };
  };

  const getEDOBEntries = async () => {
    const { data, error } = await supabase
      .from('edob_entries')
      .select(`
        *,
        profiles (guard_name)
      `)
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching EDOB entries:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  };

  // Incident Report Functions
  const saveIncidentReport = async (report: any) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('incident_reports')
      .insert({
        user_id: user.id,
        date: report.date,
        time: report.time,
        location: report.location,
        incident_type: report.incidentType,
        description: report.description,
        people_involved: report.peopleInvolved,
        actions_taken: report.actionsTaken
      });

    if (error) {
      console.error('Error saving incident report:', error);
      toast.error('Failed to save incident report');
      return { error };
    }

    toast.success('Incident report saved successfully');
    return { error: null };
  };

  const getIncidentReports = async () => {
    const { data, error } = await supabase
      .from('incident_reports')
      .select(`
        *,
        profiles (guard_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching incident reports:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  };

  // Visitor Log Functions
  const saveVisitorLog = async (visitor: any) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('visitor_logs')
      .insert({
        user_id: user.id,
        visitor_name: visitor.visitorName,
        company: visitor.company,
        purpose: visitor.purpose,
        host_contact: visitor.hostContact,
        arrival_time: visitor.arrivalTime,
        departure_time: visitor.departureTime,
        badge_number: visitor.badgeNumber,
        vehicle_reg: visitor.vehicleReg
      });

    if (error) {
      console.error('Error saving visitor log:', error);
      toast.error('Failed to save visitor log');
      return { error };
    }

    toast.success('Visitor log saved successfully');
    return { error: null };
  };

  const getVisitorLogs = async () => {
    const { data, error } = await supabase
      .from('visitor_logs')
      .select(`
        *,
        profiles (guard_name)
      `)
      .order('arrival_time', { ascending: false });

    if (error) {
      console.error('Error fetching visitor logs:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  };

  // Shift Log Functions
  const saveShiftLog = async (shiftLog: any) => {
    if (!user) return { error: 'User not authenticated' };

    const { error } = await supabase
      .from('shift_logs')
      .insert({
        user_id: user.id,
        guard_id: shiftLog.guardId,
        guard_name: shiftLog.guardName,
        action: shiftLog.action,
        timestamp: shiftLog.timestamp
      });

    if (error) {
      console.error('Error saving shift log:', error);
      toast.error('Failed to save shift log');
      return { error };
    }

    toast.success('Shift log saved successfully');
    return { error: null };
  };

  const getShiftLogs = async () => {
    const { data, error } = await supabase
      .from('shift_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error fetching shift logs:', error);
      return { data: [], error };
    }

    return { data: data || [], error: null };
  };

  return {
    saveEDOBEntry,
    getEDOBEntries,
    saveIncidentReport,
    getIncidentReports,
    saveVisitorLog,
    getVisitorLogs,
    saveShiftLog,
    getShiftLogs
  };
};
