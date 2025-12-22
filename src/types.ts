// Types for the application

export type Role = 'docente' | 'dipendente' | 'amministratore';

export interface Person {
  id: string;
  name: string;
  surname: string;
  isDocente: boolean;
  isAmministratore: boolean;
  isDipendente: boolean;
  email?: string;
  phone?: string;
  homeAddress?: string;
}

export interface Vehicle {
  id: string;
  personId: string;
  make: string;
  model: string;
  plate: string;
  reimbursementRate: number; // Euro per km
}

export interface RouteDistance {
  id: string;
  label: string; // es. "Strada Normale", "Autostrada", "Percorso Veloce"
  distance: number; // in km
  tollEntryStation?: string; // Casello di entrata (opzionale)
  tollExitStation?: string; // Casello di uscita (opzionale)
  tollAmount?: number; // Importo pedaggio in euro (opzionale)
}

export interface SavedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distances: RouteDistance[]; // Array di distanze multiple
}

export interface Trip {
  id: string;
  date: string;
  personId: string;
  vehicleId: string;
  origin: string;
  destination: string;
  distance: number; // in km
  purpose: string;
  isRoundTrip: boolean;
  tripRole?: Role; // Il ruolo in cui è stato effettuato il viaggio
  savedRouteId?: string;
  selectedDistanceId?: string; // ID della distanza selezionata dal percorso salvato
  hasToll?: boolean; // Se questo viaggio include pedaggi
  tollEntryStation?: string; // Casello di entrata
  tollExitStation?: string; // Casello di uscita
  tollAmount?: number; // Importo pedaggio in euro
}

export interface MonthlyReport {
  month: number; // 0-11
  year: number;
  personId: string;
  trips: Trip[];
  totalDistance: number;
  totalReimbursement: number;
  totalTollFees: number; // Totale pedaggi del mese
}

export interface AppState {
  people: Person[];
  vehicles: Vehicle[];
  trips: Trip[];
  savedRoutes: SavedRoute[];
}

export interface UserProfile {
  id: string;
  personId: string | null;
  isAdmin: boolean;
  email: string;
}

export interface AuthState {
  user: UserProfile | null;
  loading: boolean;
}