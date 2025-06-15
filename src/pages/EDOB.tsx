
import { useState } from "react";
import { Link } from "react-router-dom";
import { Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EDOBEntry, FormValues } from "@/data/edob-types";
import EDOBForm from "@/components/edob/EDOBForm";
import EDOBLog from "@/components/edob/EDOBLog";

const EDOB = () => {
  const [entries, setEntries] = useState<EDOBEntry[]>([]);

  function onSubmit(values: FormValues) {
    const newEntry: EDOBEntry = {
        id: new Date().toISOString(),
        timestamp: new Date(),
        type: values.entryType,
        details: values.details,
        route: values.entryType === 'Patrol' ? values.patrolRoute : undefined,
        accessType: values.entryType === 'Access Control' ? values.accessType : undefined,
        personName: values.entryType === 'Access Control' ? values.personName : undefined,
        company: values.entryType === 'Access Control' ? values.company : undefined,
        alarmZone: values.entryType === 'Alarm Activation' ? values.alarmZone : undefined,
        alarmType: values.entryType === 'Alarm Activation' ? values.alarmType : undefined,
        equipmentChecked: values.entryType === 'Equipment Check' ? values.equipmentChecked : undefined,
        equipmentStatus: values.entryType === 'Equipment Check' ? values.equipmentStatus : undefined,
    };
    setEntries(prev => [newEntry, ...prev]);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
          <FileText className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Electronic Daily Occurrence Book (EDOB)</CardTitle>
            <CardDescription>Log all site activities, patrols, and observations.</CardDescription>
          </div>
          <Button asChild variant="ghost" size="icon" className="ml-auto">
            <Link to="/" aria-label="Go to dashboard">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 h-full">
            <EDOBForm onSubmit={onSubmit} />
            <EDOBLog entries={entries} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EDOB;
