
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Home, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EDOBEntry, FormValues } from "@/data/edob-types";
import EDOBForm from "@/components/edob/EDOBForm";
import EDOBLog from "@/components/edob/EDOBLog";

const EDOB = () => {
  const [entries, setEntries] = useState<EDOBEntry[]>([]);
  const [loading, setLoading] = useState(false);

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
        guardName: "Current Guard" // Simplified without auth
    };

    // Add to entries list
    setEntries(prev => [newEntry, ...prev]);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[85vh] flex flex-col">
        <CardHeader className="flex flex-row items-center gap-4">
          <FileText className="w-10 h-10 text-primary" />
          <div>
            <CardTitle className="text-2xl">Electronic Daily Occurrence Book (EDOB)</CardTitle>
            <CardDescription>Log all site activities, patrols, and observations.</CardDescription>
          </div>
          <div className="ml-auto flex gap-2">
            <Button asChild variant="ghost" size="icon">
              <Link to="/" aria-label="Go to dashboard">
                <Home className="h-5 w-5" />
              </Link>
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
