
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Shield, AlertTriangle, UserCircle } from "lucide-react"; // Removed Building, added UserCircle
// EDOBEntry might need to be redefined or imported if its structure changes with Supabase
// For now, we assume the structure fetched from Supabase will be compatible or adapted.
// import { EDOBEntry } from "@/data/edob-types";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import dayjs from "dayjs"; // For formatting timestamp

// Define a type for entries fetched from Supabase
// This should match the structure of your 'edob_entries' table + any joins (e.g., user email)
export interface SupabaseEDOBEntry {
  id: string;
  timestamp: string; // timestamptz comes as string
  type: string;
  details: string;
  route?: string | null;
  user_id?: string | null;
  site_id?: string | null;
  created_at: string;
  // Optional: include user email if joining with auth.users
  users?: { email?: string | null } | null;
}


const EDOBLog = () => { // Removed props: entries, loading
  const [entries, setEntries] = useState<SupabaseEDOBEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        // Fetch entries and related user's email (optional join)
        // Adjust the select query based on what user information you want.
        // If you stored guardName directly and don't need email, simplify the query.
        const { data, error } = await supabase
          .from("edob_entries")
          .select(`
            id,
            timestamp,
            type,
            details,
            route,
            user_id,
            created_at,
            users ( email )
          `)
          .order("timestamp", { ascending: false })
          .limit(100); // Add a limit for performance

        if (error) {
          console.error("Error fetching EDOB entries:", error);
          toast.error(`Failed to fetch entries: ${error.message}`);
          throw error;
        }
        setEntries(data || []);
      } catch (err) {
        // Error already handled by toast
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []); // Empty dependency array means this runs once on mount, and when `key` prop changes (remount)

  const getEntryIcon = (type: string) => {
    switch (type) {
      case "Patrol":
        return <MapPin className="w-4 h-4" />;
      case "Access Control":
        return <User className="w-4 h-4" />;
      case "Alarm Activation":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Patrol":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "Access Control":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "Alarm Activation":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
      default: // Incident / Observation or other types
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    }
  };

  if (loading) {
    return (
      <Card className="h-full flex flex-col">
        <CardHeader>
          <CardTitle>Recent Entries</CardTitle>
          <CardDescription>Loading entries...</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2 p-4 border rounded-md">
                  <Skeleton className="h-5 w-1/4" /> {/* Badge type */}
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" /> {/* Timestamp */}
                    <Skeleton className="h-4 w-1/4" /> {/* User */}
                  </div>
                  <Skeleton className="h-10 w-full mt-1" /> {/* Details */}
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Recent Entries</CardTitle>
        <CardDescription>
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'} logged
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1">
        <ScrollArea className="h-full">
          {entries.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No entries logged yet</p>
                <p className="text-sm text-muted-foreground">Start by adding your first entry</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getEntryIcon(entry.type)}
                        <Badge className={getTypeColor(entry.type)}>
                          {entry.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {/* Format timestamp using dayjs */}
                        {dayjs(entry.timestamp).format('HH:mm:ss on DD MMM YYYY')}
                      </div>
                    </div>
                    
                    {entry.route && (
                      <p className="text-sm font-medium mb-1">Route: {entry.route}</p>
                    )}
                    
                    {/* Details are now expected to contain the specifics for Access Control/Alarm
                        If these were separate fields in Supabase, you would render them directly.
                        Since they are merged into 'details' in EDOB.tsx, we just show 'details'.
                    */}
                    
                    {entry.details && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-2">{entry.details}</p>
                    )}

                    {/* Display user info if available (e.g., email from joined users table) */}
                    {entry.users?.email && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <UserCircle className="w-3 h-3 mr-1" />
                        Logged by: {entry.users.email}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default EDOBLog;
