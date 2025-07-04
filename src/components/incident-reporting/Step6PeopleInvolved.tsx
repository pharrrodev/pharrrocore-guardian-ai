
import React, { useState, useEffect } from 'react';
import { Users2, PlusCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area'; // Added for scrollability

// Define the Person structure, now including staff_user_id
interface Person {
  name: string;
  role: string;
  contact: string;
  staff_user_id?: string | null;
}

interface StaffMember { // For the prop from parent
  id: string;
  name: string;
}

interface Step6PeopleInvolvedProps {
  formData: { peopleInvolved?: Person[] };
  updateFormData: (data: { peopleInvolved: Person[] }) => void;
  availableStaff: StaffMember[]; // New prop
  isLoadingStaff: boolean;      // New prop
}

const personRoleOptions = [
  "Witness",
  "Victim",
  "Suspect",
  "Staff Member",
  "Police Officer",
  "Paramedic",
  "Security Personnel",
  "Client Contact",
  "Other",
  // Consider adding more specific internal roles if needed e.g. "Security Manager", "Control Room Operator"
];

// Define specific roles that should trigger the staff selection dropdown
const STAFF_ROLES = ["Staff Member", "Security Personnel", "Responding Officer"]; // Add other relevant internal roles


const Step6PeopleInvolved: React.FC<Step6PeopleInvolvedProps> = ({ formData, updateFormData, availableStaff, isLoadingStaff }) => {
  const [currentPeople, setCurrentPeople] = useState<Person[]>(formData.peopleInvolved || []);

  // Sync with parent form data if it changes
  useEffect(() => {
    // Ensure staff_user_id is preserved or initialized
    const initialPeople = (formData.peopleInvolved || []).map(p => ({
      name: p.name || '',
      role: p.role || '',
      contact: p.contact || '',
      staff_user_id: p.staff_user_id || null, // Ensure this field is part of the state
    }));
    setCurrentPeople(initialPeople);
  }, [formData.peopleInvolved]);


  const handleAddPerson = () => {
    const newPeople = [...currentPeople, { name: '', role: '', contact: '', staff_user_id: null }]; // Initialize staff_user_id
    setCurrentPeople(newPeople);
    updateFormData({ peopleInvolved: newPeople });
  };

  const handleRemovePerson = (indexToRemove: number) => {
    const newPeople = currentPeople.filter((_, index) => index !== indexToRemove);
    setCurrentPeople(newPeople);
    updateFormData({ peopleInvolved: newPeople });
  };

  const handlePersonChange = (index: number, field: keyof Person, value: string | null) => {
    const newPeople = currentPeople.map((person, i) => {
      if (i === index) {
        const updatedPerson = { ...person, [field]: value };
        // If role changes away from a staff role, clear staff_user_id
        // Also, if the name was auto-filled from staff selection, user might want to clear/edit it.
        // For now, just clearing staff_user_id. Name remains as is unless changed by staff selection.
        if (field === 'role' && !STAFF_ROLES.includes(value || '')) {
          updatedPerson.staff_user_id = null;
        }
        return updatedPerson;
      }
      return person;
    });
    setCurrentPeople(newPeople);
    updateFormData({ peopleInvolved: newPeople });
  };

  const handleStaffSelection = (index: number, staffUserId: string) => {
    const selectedStaff = availableStaff.find(s => s.id === staffUserId);
    const newPeople = currentPeople.map((person, i) => {
      if (i === index) {
        if (selectedStaff) {
          return {
            ...person,
            staff_user_id: selectedStaff.id,
            name: selectedStaff.name, // Auto-fill name
          };
        } else { // "None" or empty selection from staff dropdown
          return {
            ...person,
            staff_user_id: null,
            // Optionally clear name if it was previously auto-filled, or leave as is for manual input
            // name: '',
          };
        }
      }
      return person;
    });
    setCurrentPeople(newPeople);
    updateFormData({ peopleInvolved: newPeople });
  };


  return (
    <div className="w-full max-w-2xl text-center mx-auto"> {/* Increased max-width */}
      <div className="flex justify-center mb-6">
        <div className="bg-blue-100 dark:bg-primary/20 rounded-full p-3">
          <Users2 className="w-10 h-10 text-primary" />
        </div>
      </div>
      <h3 className="text-xl font-semibold mb-2">People Involved or Notified</h3>
      <p className="text-muted-foreground mb-6">
        Add details for each person involved or notified. You can add multiple people.
      </p>

      <ScrollArea className="h-[300px] w-full pr-3 mb-4"> {/* Added ScrollArea */}
        <div className="space-y-4">
          {currentPeople.map((person, index) => (
            <Card key={index} className="text-left">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-medium">Person {index + 1}</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemovePerson(index)}
                    aria-label={`Remove person ${index + 1}`}
                    className="text-red-500 hover:text-red-700"
                  >
                    <XCircle className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>

                <div>
                  <Label htmlFor={`personName-${index}`}>Name</Label>
                  <Input
                    id={`personName-${index}`}
                    value={person.name}
                    onChange={(e) => handlePersonChange(index, 'name', e.target.value)}
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <Label htmlFor={`personRole-${index}`}>Role</Label>
                  <Select
                    value={person.role}
                    onValueChange={(value) => handlePersonChange(index, 'role', value)}
                  >
                    <SelectTrigger id={`personRole-${index}`}>
                      <SelectValue placeholder="Select role..." />
                    </SelectTrigger>
                    <SelectContent>
                      {personRoleOptions.map(roleOption => (
                        <SelectItem key={roleOption} value={roleOption}>{roleOption}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional Staff Member Selection */}
                {STAFF_ROLES.includes(person.role) && (
                  <div>
                    <Label htmlFor={`staffMemberSelect-${index}`}>Select Staff Member (Optional)</Label>
                    <Select
                      value={person.staff_user_id || ""} // Bind to staff_user_id
                      onValueChange={(staffId) => handleStaffSelection(index, staffId)}
                      disabled={isLoadingStaff}
                    >
                      <SelectTrigger id={`staffMemberSelect-${index}`}>
                        <SelectValue placeholder={isLoadingStaff ? "Loading staff..." : "Select staff member..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingStaff ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : (
                          <>
                            <SelectItem value="">None (or manually enter name)</SelectItem>
                            {availableStaff.map(staff => (
                              <SelectItem key={staff.id} value={staff.id}>{staff.name}</SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor={`personContact-${index}`}>Contact Details (Optional)</Label>
                  <Input
                    id={`personContact-${index}`}
                    value={person.contact}
                    onChange={(e) => handlePersonChange(index, 'contact', e.target.value)}
                    placeholder="Phone, email, or other ID"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      <Button variant="outline" onClick={handleAddPerson} className="w-full md:w-auto">
        <PlusCircle className="w-4 h-4 mr-2" /> Add Person
      </Button>

      <div
        className={cn(
          "min-h-[60px] flex items-center justify-center mt-6 p-3 bg-orange-100 dark:bg-orange-900/50 border border-orange-200 dark:border-orange-800/70 rounded-md text-orange-700 dark:text-orange-300 text-sm",
          // Validation: Ensure at least one person is added and their name is filled if not empty form.
          (currentPeople.length === 0 || (currentPeople.length > 0 && currentPeople.every(p => !p.name.trim() && !p.role && !p.contact))) && currentPeople.length > 0 ? "visible" : "invisible",
          currentPeople.length === 0 ? "visible" : "invisible" // Simplified: show if no one is added yet.
        )}
      >
        Please add at least one person involved or notified.
      </div>
    </div>
  );
};

export default Step6PeopleInvolved;
