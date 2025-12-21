// Types for the application

export type Role = 'docente' | 'dipendente' | 'amministratore';

export interface Person {
  id: string;
  name: string;
  surname: string;
  role: Role;
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
  savedRouteId?: string;
  selectedDistanceId?: string; // ID della distanza selezionata dal percorso salvato
}

export interface MonthlyReport {
  month: number; // 0-11
  year: number;
  personId: string;
  trips: Trip[];
  totalDistance: number;
  totalReimbursement: number;
}

export interface AppState {
  people: Person[];
  vehicles: Vehicle[];
  trips: Trip[];
  savedRoutes: SavedRoute[];
}