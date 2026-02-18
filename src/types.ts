export type Role = 'docente' | 'dipendente' | 'amministratore';

export type ExpenseType = 'treno' | 'supplemento_treno' | 'aereo' | 'mezzi_pubblici' | 'taxi' | 'parcheggio' | 'altro';

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
  reimbursementRate: number;
}

export interface RouteDistance {
  id: string;
  label: string;
  distance: number;
  tollEntryStation?: string;
  tollExitStation?: string;
  tollAmount?: number;
}

export interface SavedRoute {
  id: string;
  name: string;
  origin: string;
  destination: string;
  distances: RouteDistance[];
}

export interface TripMeal {
  id: string;
  tripId: string;
  mealType: 'pranzo' | 'cena';
  amount: number;
}

export interface Trip {
  id: string;
  date: string;
  personId: string;
  vehicleId: string;
  origin: string;
  destination: string;
  distance: number;
  purpose: string;
  isRoundTrip: boolean;
  tripRole?: Role;
  savedRouteId?: string;
  selectedDistanceId?: string;
  hasToll?: boolean;
  tollEntryStation?: string;
  tollExitStation?: string;
  tollAmount?: number;
  returnTollEntryStation?: string;
  returnTollExitStation?: string;
  returnTollAmount?: number;
  hasMeal?: boolean;
  mealType?: 'pranzo' | 'cena';
  mealAmount?: number;
  meals?: TripMeal[];
}

export interface TripExpense {
  id: string;
  personId: string;
  tripId?: string;
  date: string;
  expenseType: ExpenseType;
  description: string;
  fromLocation: string;
  toLocation: string;
  amount: number;
  notes: string;
  createdAt: string;
}

export interface Accommodation {
  id: string;
  personId: string;
  dateFrom: string;
  dateTo: string;
  location: string;
  amount: number;
  notes: string;
  createdAt: string;
}

export type ReportPeriodType = 'mensile' | 'trimestrale' | 'semestrale' | 'personalizzato';

export interface MonthlyReport {
  month: number;
  year: number;
  personId: string;
  trips: Trip[];
  totalDistance: number;
  totalReimbursement: number;
  totalTollFees: number;
  totalMealReimbursement: number;
  expenses: TripExpense[];
  totalExpenses: number;
  accommodations: Accommodation[];
  totalAccommodations: number;
}

export interface PeriodReport {
  dateFrom: Date;
  dateTo: Date;
  periodLabel: string;
  personId: string;
  trips: Trip[];
  totalDistance: number;
  totalReimbursement: number;
  totalTollFees: number;
  totalMealReimbursement: number;
  expenses: TripExpense[];
  totalExpenses: number;
  accommodations: Accommodation[];
  totalAccommodations: number;
}

export interface TollBooth {
  id: string;
  entryStation: string;
  exitStation: string;
  amount: number;
  usageCount: number;
  lastUsed?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FavoriteDestination {
  id: string;
  name: string;
  address: string;
  defaultDistance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppState {
  people: Person[];
  vehicles: Vehicle[];
  trips: Trip[];
  savedRoutes: SavedRoute[];
  tollBooths: TollBooth[];
  tripExpenses: TripExpense[];
  accommodations: Accommodation[];
  favoriteDestinations: FavoriteDestination[];
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

export const EXPENSE_TYPE_LABELS: Record<ExpenseType, string> = {
  treno: 'Biglietto ferroviario',
  supplemento_treno: 'Supplemento ferroviario',
  aereo: 'Biglietto aereo',
  mezzi_pubblici: 'Biglietti mezzi pubblici',
  taxi: 'Taxi',
  parcheggio: 'Parcheggio',
  altro: 'Altro',
};
