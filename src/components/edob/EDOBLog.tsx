
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { EDOBEntry } from "@/data/edob-types";

interface EDOBLogProps {
  entries: EDOBEntry[];
}

const EDOBLog = ({ entries }: EDOBLogProps) => {
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4">Logbook</h3>
      <Separator />
      <ScrollArea className="flex-1 -mr-6 pr-6 mt-4">
        {entries.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>No entries logged yet.</p>
            <p className="text-sm">Use the form on the left to add a new entry.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.map(entry => (
              <Card key={entry.id} className="bg-muted/50">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle className="text-green-500 w-5 h-5" />
                      {entry.type}
                    </CardTitle>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(entry.timestamp, "PPP p")}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {entry.route && <CardDescription>Route: {entry.route}</CardDescription>}
                  {entry.accessType && <CardDescription>Access: {entry.accessType} - {entry.personName} ({entry.company})</CardDescription>}
                  {entry.alarmZone && <CardDescription>Alarm: {entry.alarmType} in {entry.alarmZone}</CardDescription>}
                  {entry.equipmentChecked && <CardDescription>Equipment Check: {entry.equipmentChecked} - <span className={cn(entry.equipmentStatus === 'OK' ? 'text-green-500' : 'text-orange-500', "font-semibold")}>{entry.equipmentStatus}</span></CardDescription>}
                  
                  {entry.type === 'Patrol' && entry.details.trim() === '' ? (
                    <p className="text-sm italic text-muted-foreground pt-2">A.I.O (All In Order)</p>
                  ) : (
                    entry.details.trim() !== '' && (
                      <p className="text-sm whitespace-pre-wrap pt-2">{entry.details}</p>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default EDOBLog;
