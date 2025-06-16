
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, FileText, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EDOBEntry, FormValues } from "@/data/edob-types";
import EDOBForm from "@/components/edob/EDOBForm";
import EDOBLog from "@/components/edob/EDOBLog";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const EDOB = () => {
  const [entries, setEntries] = useState<EDOBEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { saveEDOBEntry, getEDOBEntries } = useSupabaseData();
  const { signOut, profile } = useAuth();

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    setLoading(true);
    const { data, error } = await getEDOBEntries();
    if (!error && data) {
      // Transform Supabase data to match EDOBEntry format
      const transformedEntries = data.map((entry: any) => ({
        id: entry.id,
        timestamp: new Date(entry.timestamp),
        type: entry.entry_type,
        details: entry.details || "",
        route: entry.patrol_route,
        accessType: entry.access_type,
        personName: entry.person_name,
        company: entry.company,
        alarmZone: entry.alarm_zone,
        alarmType: entry.alarm_type,
        guardName: entry.profiles?.guard_name
      }));
      setEntries(transformedEntries);
    }
    setLoading(false);
  };

  async function onSubmit(values: FormValues) {
    const newEntry: EDOBEntry = {
        id: new Date().toISOString(),
        timestamp: new Date(),
        type: values.entryType,
        details: (values.entryType === 'Patrol' && (!values.details || values.details.trim() === '')) ? "A.I.O." : (values.details || ""),
        route: values.entryType === 'Patrol' ? values.patrolRoute : undefined,
        accessType: values.entryType === 'Access Control' ? values.accessType : undefined,
        personName: values.entryType === 'Access Control' ? values.personName : undefined,
        company: values.entryType === 'Access Control' ? values.company : undefined,
        alarmZone: values.entryType === 'Alarm Activation' ? values.alarmZone : undefined,
        alarmType: values.entryType === 'Alarm Activation' ? values.alarmType : undefined,
    };

    // Save to Supabase
    const { error } = await saveEDOBEntry(newEntry);
    if (!error) {
      // Reload entries to show the new one
      await loadEntries();
    }
  }

  const handleSignOut = async () => {
    await signOut();
    toast.success('Signed out successfully');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
          <FileText className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Electronic Daily Occurrence Book (EDOB)</CardTitle>
            <CardDescription>Log all site activities, patrols, and observations.</CardDescription>
            {profile && (
              <p className="text-sm text-muted-foreground mt-1">
                Logged in as: {profile.guard_name} ({profile.guard_id})
              </p>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link to="/" aria-label="Go to dashboard">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="icon" onClick={handleSignOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 h-full">
            <EDOBForm onSubmit={onSubmit} />
            <EDOBLog entries={entries} loading={loading} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EDOB;
