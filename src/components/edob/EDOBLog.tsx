
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Shield, AlertTriangle, UserCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import dayjs from "dayjs";

// Define a type for entries fetched from Supabase
export interface SupabaseEDOBEntry {
  id: string;
  timestamp: string;
  entry_type: string; // This matches the database column name
  details: string;
  patrol_route?: string | null;
  user_id?: string | null;
  created_at: string;
  profiles?: { full_name?: string | null } | null;
}

const EDOBLog = () => {
  const [entries, setEntries] = useState<SupabaseEDOBEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const { data: fetchedData, error } = await supabase.functions.invoke('get-edob-entries');

        if (error) {
          console.error("Error fetching EDOB entries via function:", error);
          toast.error(`Failed to fetch entries: ${error.message}`);
          throw error;
        }

        setEntries(fetchedData || []);
      } catch (err) {
        // Error already handled by toast if it came from the invoke error block
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

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
      default:
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
                  <Skeleton className="h-5 w-1/4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-4 w-1/4" />
                  </div>
                  <Skeleton className="h-10 w-full mt-1" />
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
                        {getEntryIcon(entry.entry_type)}
                        <Badge className={getTypeColor(entry.entry_type)}>
                          {entry.entry_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {dayjs(entry.timestamp).format('HH:mm:ss on DD MMM YYYY')}
                      </div>
                    </div>
                    
                    {entry.patrol_route && (
                      <p className="text-sm font-medium mb-1">Route: {entry.patrol_route}</p>
                    )}
                    
                    {entry.details && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap break-words mt-2">{entry.details}</p>
                    )}

                    {entry.profiles?.full_name && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <UserCircle className="w-3 h-3 mr-1" />
                        Logged by: {entry.profiles.full_name}
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
