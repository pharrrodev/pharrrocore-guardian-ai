
import { Shift } from '@/data/rota-data';

export interface RotaConfirmation {
  id: string;
  guardId: string;
  guardName: string;
  date: string;
  shiftId: string;
  confirmed: boolean;
  timestamp: string;
}

// Load rota data from localStorage (simulating JSON file storage)
export const loadRotaData = (): Shift[] => {
  try {
    const stored = localStorage.getItem('rota-data');
    if (stored) {
      return JSON.parse(stored);
    }
    // Return empty array if no data exists
    return [];
  } catch (error) {
    console.error('Error loading rota data:', error);
    return [];
  }
};

// Save rota data to localStorage (simulating JSON file storage)
export const saveRotaData = (shifts: Shift[]): void => {
  try {
    localStorage.setItem('rota-data', JSON.stringify(shifts));
    console.log('Rota data saved successfully');
  } catch (error) {
    console.error('Error saving rota data:', error);
  }
};

// Load confirmations from localStorage (simulating CSV storage)
export const loadConfirmations = (): RotaConfirmation[] => {
  try {
    const stored = localStorage.getItem('rota-confirmations');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('Error loading confirmations:', error);
    return [];
  }
};

// Save confirmations to localStorage
export const saveConfirmations = (confirmations: RotaConfirmation[]): void => {
  try {
    localStorage.setItem('rota-confirmations', JSON.stringify(confirmations));
    console.log('Confirmations saved successfully');
  } catch (error) {
    console.error('Error saving confirmations:', error);
  }
};

// Add a new confirmation
export const addConfirmation = (confirmation: Omit<RotaConfirmation, 'id' | 'timestamp'>): RotaConfirmation => {
  const newConfirmation: RotaConfirmation = {
    ...confirmation,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };

  const existing = loadConfirmations();
  // Remove any existing confirmation for same guard/date/shift
  const filtered = existing.filter(c => 
    !(c.guardId === confirmation.guardId && 
      c.date === confirmation.date && 
      c.shiftId === confirmation.shiftId)
  );
  
  filtered.push(newConfirmation);
  saveConfirmations(filtered);
  
  return newConfirmation;
};
