
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, User, Building, Shield, AlertTriangle } from "lucide-react";
import { EDOBEntry } from "@/data/edob-types";
import { Skeleton } from "@/components/ui/skeleton";

interface EDOBLogProps {
  entries: EDOBEntry[];
  loading?: boolean;
}

const EDOBLog = ({ entries, loading = false }: EDOBLogProps) => {
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
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-12 w-full" />
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
                        {entry.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                    
                    {entry.route && (
                      <p className="text-sm font-medium mb-1">Route: {entry.route}</p>
                    )}
                    
                    {entry.accessType && (
                      <div className="text-sm mb-1">
                        <p><span className="font-medium">Access Type:</span> {entry.accessType}</p>
                        {entry.personName && <p><span className="font-medium">Person:</span> {entry.personName}</p>}
                        {entry.company && <p><span className="font-medium">Company:</span> {entry.company}</p>}
                      </div>
                    )}
                    
                    {entry.alarmZone && (
                      <div className="text-sm mb-1">
                        <p><span className="font-medium">Zone:</span> {entry.alarmZone}</p>
                        {entry.alarmType && <p><span className="font-medium">Type:</span> {entry.alarmType}</p>}
                      </div>
                    )}
                    
                    {entry.details && (
                      <p className="text-sm text-muted-foreground mt-2">{entry.details}</p>
                    )}

                    {(entry as any).guardName && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Logged by: {(entry as any).guardName}
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
