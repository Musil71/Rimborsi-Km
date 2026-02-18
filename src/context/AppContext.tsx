import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  AppState, Person, Vehicle, Trip, SavedRoute, MonthlyReport,
  RouteDistance, TollBooth, TripExpense, Accommodation, TripMeal, FavoriteDestination
} from '../types';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { supabase } from '../lib/supabase';

interface AppContextType {
  state: AppState;
  addPerson: (person: Omit<Person, 'id'>) => Promise<void>;
  updatePerson: (person: Person) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => Promise<void>;
  updateVehicle: (vehicle: Vehicle) => Promise<void>;
  deleteVehicle: (id: string) => Promise<void>;
  addTrip: (trip: Omit<Trip, 'id'>, meals?: Omit<TripMeal, 'id' | 'tripId'>[]) => Promise<void>;
  updateTrip: (trip: Trip, meals?: Omit<TripMeal, 'id' | 'tripId'>[]) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addSavedRoute: (route: Omit<SavedRoute, 'id'>) => Promise<void>;
  updateSavedRoute: (route: SavedRoute) => Promise<void>;
  deleteSavedRoute: (id: string) => Promise<void>;
  addRouteDistance: (routeId: string, distance: Omit<RouteDistance, 'id'>) => Promise<void>;
  updateRouteDistance: (routeId: string, distance: RouteDistance) => Promise<void>;
  deleteRouteDistance: (routeId: string, distanceId: string) => Promise<void>;
  addTripExpense: (expense: Omit<TripExpense, 'id' | 'createdAt'>) => Promise<void>;
  updateTripExpense: (expense: TripExpense) => Promise<void>;
  deleteTripExpense: (id: string) => Promise<void>;
  addAccommodation: (accommodation: Omit<Accommodation, 'id' | 'createdAt'>) => Promise<void>;
  updateAccommodation: (accommodation: Accommodation) => Promise<void>;
  deleteAccommodation: (id: string) => Promise<void>;
  addFavoriteDestination: (dest: Omit<FavoriteDestination, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateFavoriteDestination: (dest: FavoriteDestination) => Promise<void>;
  deleteFavoriteDestination: (id: string) => Promise<void>;
  generateMonthlyReport: (personId: string, month: number, year: number) => MonthlyReport | null;
  getPerson: (id: string) => Person | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getVehiclesForPerson: (personId: string) => Vehicle[];
  getSavedRoute: (id: string) => SavedRoute | undefined;
  getRouteDistance: (routeId: string, distanceId: string) => RouteDistance | undefined;
  getTollBooth: (entryStation: string, exitStation: string) => TollBooth | undefined;
  searchTollStations: (query: string) => Promise<string[]>;
  handleTollBoothOnTripSave: (entryStation: string, exitStation: string, amount: number) => Promise<void>;
  formatDate: (dateString: string) => string;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    people: [],
    vehicles: [],
    trips: [],
    savedRoutes: [],
    tollBooths: [],
    tripExpenses: [],
    accommodations: [],
    favoriteDestinations: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        peopleRes, vehiclesRes, tripsRes, routesRes, distancesRes,
        tollBoothsRes, tripMealsRes, expensesRes, accommodationsRes, favDestRes
      ] = await Promise.all([
        supabase.from('people').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('saved_routes').select('*').order('created_at', { ascending: false }),
        supabase.from('route_distances').select('*'),
        supabase.from('toll_booths').select('*').order('usage_count', { ascending: false }),
        supabase.from('trip_meals').select('*'),
        supabase.from('trip_expenses').select('*').order('date', { ascending: false }),
        supabase.from('accommodations').select('*').order('date_from', { ascending: false }),
        supabase.from('favorite_destinations').select('*').order('name', { ascending: true })
      ]);

      const people: Person[] = (peopleRes.data || []).map(p => ({
        id: p.id,
        name: p.name,
        surname: p.surname || '',
        isDocente: p.is_docente || false,
        isAmministratore: p.is_amministratore || false,
        isDipendente: p.is_dipendente || false,
        email: p.email,
        phone: p.phone,
        homeAddress: p.home_address
      }));

      const vehicles: Vehicle[] = (vehiclesRes.data || []).map(v => ({
        id: v.id,
        personId: v.person_id,
        make: v.make || '',
        model: v.model,
        plate: v.plate || v.license_plate,
        reimbursementRate: parseFloat(v.reimbursement_rate)
      }));

      const mealsMap = new Map<string, TripMeal[]>();
      (tripMealsRes.data || []).forEach(m => {
        if (!mealsMap.has(m.trip_id)) mealsMap.set(m.trip_id, []);
        mealsMap.get(m.trip_id)!.push({
          id: m.id,
          tripId: m.trip_id,
          mealType: m.meal_type,
          amount: parseFloat(m.amount)
        });
      });

      const trips: Trip[] = (tripsRes.data || []).map(t => ({
        id: t.id,
        date: t.date,
        personId: t.person_id,
        vehicleId: t.vehicle_id,
        tripRole: t.trip_role,
        origin: t.origin,
        destination: t.destination,
        distance: parseFloat(t.distance),
        purpose: t.purpose || '',
        isRoundTrip: t.is_round_trip || false,
        savedRouteId: t.saved_route_id,
        selectedDistanceId: t.selected_distance_id,
        hasToll: t.has_toll || false,
        tollEntryStation: t.toll_entry_station,
        tollExitStation: t.toll_exit_station,
        tollAmount: t.toll_amount ? parseFloat(t.toll_amount) : undefined,
        returnTollEntryStation: t.return_toll_entry_station,
        returnTollExitStation: t.return_toll_exit_station,
        returnTollAmount: t.return_toll_amount ? parseFloat(t.return_toll_amount) : undefined,
        hasMeal: t.has_meal || false,
        mealType: t.meal_type,
        mealAmount: t.meal_amount ? parseFloat(t.meal_amount) : undefined,
        meals: mealsMap.get(t.id) || []
      }));

      const distancesMap = new Map<string, RouteDistance[]>();
      (distancesRes.data || []).forEach(d => {
        if (!distancesMap.has(d.route_id)) distancesMap.set(d.route_id, []);
        distancesMap.get(d.route_id)!.push({
          id: d.id,
          label: d.label,
          distance: parseFloat(d.distance),
          tollEntryStation: d.toll_entry_station,
          tollExitStation: d.toll_exit_station,
          tollAmount: d.toll_amount ? parseFloat(d.toll_amount) : undefined
        });
      });

      const savedRoutes: SavedRoute[] = (routesRes.data || []).map(r => ({
        id: r.id,
        name: r.name,
        origin: r.origin,
        destination: r.destination,
        distances: distancesMap.get(r.id) || []
      }));

      const tollBooths: TollBooth[] = (tollBoothsRes.data || []).map(tb => ({
        id: tb.id,
        entryStation: tb.entry_station,
        exitStation: tb.exit_station,
        amount: parseFloat(tb.amount),
        usageCount: tb.usage_count,
        lastUsed: tb.last_used,
        createdAt: tb.created_at,
        updatedAt: tb.updated_at
      }));

      const tripExpenses: TripExpense[] = (expensesRes.data || []).map(e => ({
        id: e.id,
        personId: e.person_id,
        tripId: e.trip_id || undefined,
        date: e.date,
        expenseType: e.expense_type,
        description: e.description || '',
        fromLocation: e.from_location || '',
        toLocation: e.to_location || '',
        amount: parseFloat(e.amount),
        notes: e.notes || '',
        createdAt: e.created_at
      }));

      const accommodations: Accommodation[] = (accommodationsRes.data || []).map(a => ({
        id: a.id,
        personId: a.person_id,
        dateFrom: a.date_from,
        dateTo: a.date_to,
        location: a.location || '',
        amount: parseFloat(a.amount),
        notes: a.notes || '',
        createdAt: a.created_at
      }));

      const favoriteDestinations: FavoriteDestination[] = (favDestRes.data || []).map(d => ({
        id: d.id,
        name: d.name,
        address: d.address,
        defaultDistance: parseFloat(d.default_distance),
        createdAt: d.created_at,
        updatedAt: d.updated_at
      }));

      setState({ people, vehicles, trips, savedRoutes, tollBooths, tripExpenses, accommodations, favoriteDestinations });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addPerson = async (person: Omit<Person, 'id'>) => {
    const { data, error } = await supabase
      .from('people')
      .insert([{
        name: person.name,
        surname: person.surname,
        is_docente: person.isDocente,
        is_amministratore: person.isAmministratore,
        is_dipendente: person.isDipendente,
        email: person.email,
        phone: person.phone,
        home_address: person.homeAddress
      }])
      .select()
      .single();

    if (error) throw error;

    setState(prev => ({
      ...prev,
      people: [{
        id: data.id,
        name: data.name,
        surname: data.surname,
        isDocente: data.is_docente || false,
        isAmministratore: data.is_amministratore || false,
        isDipendente: data.is_dipendente || false,
        email: data.email,
        phone: data.phone,
        homeAddress: data.home_address
      }, ...prev.people]
    }));
  };

  const updatePerson = async (person: Person) => {
    const { error } = await supabase
      .from('people')
      .update({
        name: person.name,
        surname: person.surname,
        is_docente: person.isDocente,
        is_amministratore: person.isAmministratore,
        is_dipendente: person.isDipendente,
        email: person.email,
        phone: person.phone,
        home_address: person.homeAddress
      })
      .eq('id', person.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      people: prev.people.map(p => p.id === person.id ? person : p)
    }));
  };

  const deletePerson = async (id: string) => {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      people: prev.people.filter(p => p.id !== id),
      vehicles: prev.vehicles.filter(v => v.personId !== id),
      trips: prev.trips.filter(t => t.personId !== id),
      tripExpenses: prev.tripExpenses.filter(e => e.personId !== id),
      accommodations: prev.accommodations.filter(a => a.personId !== id)
    }));
  };

  const addVehicle = async (vehicle: Omit<Vehicle, 'id'>) => {
    const { data, error } = await supabase
      .from('vehicles')
      .insert([{
        person_id: vehicle.personId,
        make: vehicle.make,
        model: vehicle.model,
        plate: vehicle.plate,
        license_plate: vehicle.plate,
        reimbursement_rate: vehicle.reimbursementRate
      }])
      .select()
      .single();

    if (error) throw error;

    setState(prev => ({
      ...prev,
      vehicles: [{
        id: data.id,
        personId: data.person_id,
        make: data.make,
        model: data.model,
        plate: data.plate,
        reimbursementRate: parseFloat(data.reimbursement_rate)
      }, ...prev.vehicles]
    }));
  };

  const updateVehicle = async (vehicle: Vehicle) => {
    const { error } = await supabase
      .from('vehicles')
      .update({
        person_id: vehicle.personId,
        make: vehicle.make,
        model: vehicle.model,
        plate: vehicle.plate,
        license_plate: vehicle.plate,
        reimbursement_rate: vehicle.reimbursementRate
      })
      .eq('id', vehicle.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.map(v => v.id === vehicle.id ? vehicle : v)
    }));
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from('vehicles').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      vehicles: prev.vehicles.filter(v => v.id !== id),
      trips: prev.trips.filter(t => t.vehicleId !== id)
    }));
  };

  const addTrip = async (trip: Omit<Trip, 'id'>, meals?: Omit<TripMeal, 'id' | 'tripId'>[]) => {
    const { data, error } = await supabase
      .from('trips')
      .insert([{
        person_id: trip.personId,
        vehicle_id: trip.vehicleId,
        trip_role: trip.tripRole,
        saved_route_id: trip.savedRouteId,
        selected_distance_id: trip.selectedDistanceId,
        date: trip.date,
        origin: trip.origin,
        destination: trip.destination,
        distance: trip.distance,
        purpose: trip.purpose,
        is_round_trip: trip.isRoundTrip,
        has_toll: trip.hasToll || false,
        toll_entry_station: trip.tollEntryStation,
        toll_exit_station: trip.tollExitStation,
        toll_amount: trip.tollAmount,
        return_toll_entry_station: trip.returnTollEntryStation,
        return_toll_exit_station: trip.returnTollExitStation,
        return_toll_amount: trip.returnTollAmount,
        has_meal: (meals && meals.length > 0) || trip.hasMeal || false,
        meal_type: trip.mealType,
        meal_amount: trip.mealAmount
      }])
      .select()
      .single();

    if (error) throw error;

    let savedMeals: TripMeal[] = [];
    if (meals && meals.length > 0) {
      const { data: mealsData, error: mealsError } = await supabase
        .from('trip_meals')
        .insert(meals.map(m => ({ trip_id: data.id, meal_type: m.mealType, amount: m.amount })))
        .select();
      if (mealsError) throw mealsError;
      savedMeals = (mealsData || []).map(m => ({
        id: m.id, tripId: m.trip_id, mealType: m.meal_type, amount: parseFloat(m.amount)
      }));
    }

    if (trip.hasToll && trip.tollEntryStation && trip.tollExitStation && trip.tollAmount) {
      await handleTollBoothOnTripSave(trip.tollEntryStation, trip.tollExitStation, trip.tollAmount);
    }
    if (trip.isRoundTrip && trip.returnTollEntryStation && trip.returnTollExitStation && trip.returnTollAmount) {
      await handleTollBoothOnTripSave(trip.returnTollEntryStation, trip.returnTollExitStation, trip.returnTollAmount);
    }

    setState(prev => ({
      ...prev,
      trips: [{
        id: data.id,
        date: data.date,
        personId: data.person_id,
        vehicleId: data.vehicle_id,
        tripRole: data.trip_role,
        origin: data.origin,
        destination: data.destination,
        distance: parseFloat(data.distance),
        purpose: data.purpose,
        isRoundTrip: data.is_round_trip,
        savedRouteId: data.saved_route_id,
        selectedDistanceId: data.selected_distance_id,
        hasToll: data.has_toll || false,
        tollEntryStation: data.toll_entry_station,
        tollExitStation: data.toll_exit_station,
        tollAmount: data.toll_amount ? parseFloat(data.toll_amount) : undefined,
        returnTollEntryStation: data.return_toll_entry_station,
        returnTollExitStation: data.return_toll_exit_station,
        returnTollAmount: data.return_toll_amount ? parseFloat(data.return_toll_amount) : undefined,
        hasMeal: data.has_meal || false,
        mealType: data.meal_type,
        mealAmount: data.meal_amount ? parseFloat(data.meal_amount) : undefined,
        meals: savedMeals
      }, ...prev.trips]
    }));
  };

  const updateTrip = async (trip: Trip, meals?: Omit<TripMeal, 'id' | 'tripId'>[]) => {
    const { error } = await supabase
      .from('trips')
      .update({
        person_id: trip.personId,
        vehicle_id: trip.vehicleId,
        trip_role: trip.tripRole,
        saved_route_id: trip.savedRouteId,
        selected_distance_id: trip.selectedDistanceId,
        date: trip.date,
        origin: trip.origin,
        destination: trip.destination,
        distance: trip.distance,
        purpose: trip.purpose,
        is_round_trip: trip.isRoundTrip,
        has_toll: trip.hasToll || false,
        toll_entry_station: trip.tollEntryStation,
        toll_exit_station: trip.tollExitStation,
        toll_amount: trip.tollAmount,
        return_toll_entry_station: trip.returnTollEntryStation,
        return_toll_exit_station: trip.returnTollExitStation,
        return_toll_amount: trip.returnTollAmount,
        has_meal: (meals && meals.length > 0) || trip.hasMeal || false,
        meal_type: trip.mealType,
        meal_amount: trip.mealAmount
      })
      .eq('id', trip.id);

    if (error) throw error;

    let savedMeals: TripMeal[] = trip.meals || [];
    if (meals !== undefined) {
      await supabase.from('trip_meals').delete().eq('trip_id', trip.id);
      if (meals.length > 0) {
        const { data: mealsData, error: mealsError } = await supabase
          .from('trip_meals')
          .insert(meals.map(m => ({ trip_id: trip.id, meal_type: m.mealType, amount: m.amount })))
          .select();
        if (mealsError) throw mealsError;
        savedMeals = (mealsData || []).map(m => ({
          id: m.id, tripId: m.trip_id, mealType: m.meal_type, amount: parseFloat(m.amount)
        }));
      } else {
        savedMeals = [];
      }
    }

    if (trip.hasToll && trip.tollEntryStation && trip.tollExitStation && trip.tollAmount) {
      await handleTollBoothOnTripSave(trip.tollEntryStation, trip.tollExitStation, trip.tollAmount);
    }
    if (trip.isRoundTrip && trip.returnTollEntryStation && trip.returnTollExitStation && trip.returnTollAmount) {
      await handleTollBoothOnTripSave(trip.returnTollEntryStation, trip.returnTollExitStation, trip.returnTollAmount);
    }

    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => t.id === trip.id ? { ...trip, meals: savedMeals } : t)
    }));
  };

  const deleteTrip = async (id: string) => {
    const { error } = await supabase.from('trips').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      trips: prev.trips.filter(t => t.id !== id)
    }));
  };

  const addSavedRoute = async (route: Omit<SavedRoute, 'id'>) => {
    const { data, error } = await supabase
      .from('saved_routes')
      .insert([{ name: route.name, origin: route.origin, destination: route.destination }])
      .select()
      .single();

    if (error) throw error;

    const newRoute: SavedRoute = {
      id: data.id,
      name: data.name,
      origin: data.origin,
      destination: data.destination,
      distances: []
    };

    if (route.distances && route.distances.length > 0) {
      const distancesData = route.distances.map(d => ({
        route_id: data.id,
        label: d.label,
        distance: d.distance,
        toll_entry_station: d.tollEntryStation,
        toll_exit_station: d.tollExitStation,
        toll_amount: d.tollAmount
      }));

      const { data: distancesResult, error: distancesError } = await supabase
        .from('route_distances')
        .insert(distancesData)
        .select();

      if (distancesError) throw distancesError;

      newRoute.distances = (distancesResult || []).map(d => ({
        id: d.id,
        label: d.label,
        distance: parseFloat(d.distance),
        tollEntryStation: d.toll_entry_station,
        tollExitStation: d.toll_exit_station,
        tollAmount: d.toll_amount ? parseFloat(d.toll_amount) : undefined
      }));
    }

    setState(prev => ({ ...prev, savedRoutes: [newRoute, ...prev.savedRoutes] }));
  };

  const updateSavedRoute = async (route: SavedRoute) => {
    const { error } = await supabase
      .from('saved_routes')
      .update({ name: route.name, origin: route.origin, destination: route.destination })
      .eq('id', route.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      savedRoutes: prev.savedRoutes.map(r => r.id === route.id ? route : r)
    }));
  };

  const deleteSavedRoute = async (id: string) => {
    const { error } = await supabase.from('saved_routes').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      savedRoutes: prev.savedRoutes.filter(r => r.id !== id)
    }));
  };

  const addRouteDistance = async (routeId: string, distance: Omit<RouteDistance, 'id'>) => {
    const { data, error } = await supabase
      .from('route_distances')
      .insert([{
        route_id: routeId,
        label: distance.label,
        distance: distance.distance,
        toll_entry_station: distance.tollEntryStation,
        toll_exit_station: distance.tollExitStation,
        toll_amount: distance.tollAmount
      }])
      .select()
      .single();

    if (error) throw error;

    const newDistance: RouteDistance = {
      id: data.id,
      label: data.label,
      distance: parseFloat(data.distance),
      tollEntryStation: data.toll_entry_station,
      tollExitStation: data.toll_exit_station,
      tollAmount: data.toll_amount ? parseFloat(data.toll_amount) : undefined
    };

    setState(prev => ({
      ...prev,
      savedRoutes: prev.savedRoutes.map(route =>
        route.id === routeId
          ? { ...route, distances: [...route.distances, newDistance] }
          : route
      )
    }));
  };

  const updateRouteDistance = async (routeId: string, distance: RouteDistance) => {
    const { error } = await supabase
      .from('route_distances')
      .update({
        label: distance.label,
        distance: distance.distance,
        toll_entry_station: distance.tollEntryStation,
        toll_exit_station: distance.tollExitStation,
        toll_amount: distance.tollAmount
      })
      .eq('id', distance.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      savedRoutes: prev.savedRoutes.map(route =>
        route.id === routeId
          ? { ...route, distances: route.distances.map(d => d.id === distance.id ? distance : d) }
          : route
      )
    }));
  };

  const deleteRouteDistance = async (routeId: string, distanceId: string) => {
    const { error } = await supabase.from('route_distances').delete().eq('id', distanceId);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      savedRoutes: prev.savedRoutes.map(route =>
        route.id === routeId
          ? { ...route, distances: route.distances.filter(d => d.id !== distanceId) }
          : route
      )
    }));
  };

  const addTripExpense = async (expense: Omit<TripExpense, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('trip_expenses')
      .insert([{
        person_id: expense.personId,
        trip_id: expense.tripId || null,
        date: expense.date,
        expense_type: expense.expenseType,
        description: expense.description,
        from_location: expense.fromLocation,
        to_location: expense.toLocation,
        amount: expense.amount,
        notes: expense.notes
      }])
      .select()
      .single();

    if (error) throw error;

    setState(prev => ({
      ...prev,
      tripExpenses: [{
        id: data.id,
        personId: data.person_id,
        tripId: data.trip_id || undefined,
        date: data.date,
        expenseType: data.expense_type,
        description: data.description || '',
        fromLocation: data.from_location || '',
        toLocation: data.to_location || '',
        amount: parseFloat(data.amount),
        notes: data.notes || '',
        createdAt: data.created_at
      }, ...prev.tripExpenses]
    }));
  };

  const updateTripExpense = async (expense: TripExpense) => {
    const { error } = await supabase
      .from('trip_expenses')
      .update({
        person_id: expense.personId,
        date: expense.date,
        expense_type: expense.expenseType,
        description: expense.description,
        from_location: expense.fromLocation,
        to_location: expense.toLocation,
        amount: expense.amount,
        notes: expense.notes
      })
      .eq('id', expense.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      tripExpenses: prev.tripExpenses.map(e => e.id === expense.id ? expense : e)
    }));
  };

  const deleteTripExpense = async (id: string) => {
    const { error } = await supabase.from('trip_expenses').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      tripExpenses: prev.tripExpenses.filter(e => e.id !== id)
    }));
  };

  const addAccommodation = async (accommodation: Omit<Accommodation, 'id' | 'createdAt'>) => {
    const { data, error } = await supabase
      .from('accommodations')
      .insert([{
        person_id: accommodation.personId,
        date_from: accommodation.dateFrom,
        date_to: accommodation.dateTo,
        location: accommodation.location,
        amount: accommodation.amount,
        notes: accommodation.notes
      }])
      .select()
      .single();

    if (error) throw error;

    setState(prev => ({
      ...prev,
      accommodations: [{
        id: data.id,
        personId: data.person_id,
        dateFrom: data.date_from,
        dateTo: data.date_to,
        location: data.location || '',
        amount: parseFloat(data.amount),
        notes: data.notes || '',
        createdAt: data.created_at
      }, ...prev.accommodations]
    }));
  };

  const updateAccommodation = async (accommodation: Accommodation) => {
    const { error } = await supabase
      .from('accommodations')
      .update({
        person_id: accommodation.personId,
        date_from: accommodation.dateFrom,
        date_to: accommodation.dateTo,
        location: accommodation.location,
        amount: accommodation.amount,
        notes: accommodation.notes
      })
      .eq('id', accommodation.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      accommodations: prev.accommodations.map(a => a.id === accommodation.id ? accommodation : a)
    }));
  };

  const deleteAccommodation = async (id: string) => {
    const { error } = await supabase.from('accommodations').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      accommodations: prev.accommodations.filter(a => a.id !== id)
    }));
  };

  const addFavoriteDestination = async (dest: Omit<FavoriteDestination, 'id' | 'createdAt' | 'updatedAt'>) => {
    const { data, error } = await supabase
      .from('favorite_destinations')
      .insert([{ name: dest.name, address: dest.address, default_distance: dest.defaultDistance }])
      .select()
      .single();

    if (error) throw error;

    setState(prev => ({
      ...prev,
      favoriteDestinations: [...prev.favoriteDestinations, {
        id: data.id,
        name: data.name,
        address: data.address,
        defaultDistance: parseFloat(data.default_distance),
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }].sort((a, b) => a.name.localeCompare(b.name))
    }));
  };

  const updateFavoriteDestination = async (dest: FavoriteDestination) => {
    const { error } = await supabase
      .from('favorite_destinations')
      .update({ name: dest.name, address: dest.address, default_distance: dest.defaultDistance, updated_at: new Date().toISOString() })
      .eq('id', dest.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      favoriteDestinations: prev.favoriteDestinations
        .map(d => d.id === dest.id ? dest : d)
        .sort((a, b) => a.name.localeCompare(b.name))
    }));
  };

  const deleteFavoriteDestination = async (id: string) => {
    const { error } = await supabase.from('favorite_destinations').delete().eq('id', id);
    if (error) throw error;

    setState(prev => ({
      ...prev,
      favoriteDestinations: prev.favoriteDestinations.filter(d => d.id !== id)
    }));
  };

  const getPerson = (id: string) => state.people.find(p => p.id === id);
  const getVehicle = (id: string) => state.vehicles.find(v => v.id === id);
  const getVehiclesForPerson = (personId: string) => state.vehicles.filter(v => v.personId === personId);
  const getSavedRoute = (id: string) => state.savedRoutes.find(r => r.id === id);
  const getRouteDistance = (routeId: string, distanceId: string) => {
    return getSavedRoute(routeId)?.distances.find(d => d.id === distanceId);
  };

  const getTollBooth = (entryStation: string, exitStation: string): TollBooth | undefined => {
    return state.tollBooths.find(
      tb => tb.entryStation.toLowerCase() === entryStation.toLowerCase() &&
            tb.exitStation.toLowerCase() === exitStation.toLowerCase()
    );
  };

  const searchTollStations = async (query: string): Promise<string[]> => {
    const normalizedQuery = query.toLowerCase();
    const stations = new Set<string>();

    state.tollBooths.forEach(tb => {
      if (tb.entryStation.toLowerCase().includes(normalizedQuery)) stations.add(tb.entryStation);
      if (tb.exitStation.toLowerCase().includes(normalizedQuery)) stations.add(tb.exitStation);
    });

    return Array.from(stations).sort((a, b) => {
      const aUsage = state.tollBooths.filter(tb => tb.entryStation === a || tb.exitStation === a).reduce((sum, tb) => sum + tb.usageCount, 0);
      const bUsage = state.tollBooths.filter(tb => tb.entryStation === b || tb.exitStation === b).reduce((sum, tb) => sum + tb.usageCount, 0);
      return bUsage - aUsage;
    });
  };

  const handleTollBoothOnTripSave = async (entryStation: string, exitStation: string, amount: number) => {
    if (!entryStation.trim() || !exitStation.trim() || amount <= 0) return;

    const existing = getTollBooth(entryStation, exitStation);

    if (existing) {
      const { data, error } = await supabase
        .from('toll_booths')
        .update({ amount, usage_count: existing.usageCount + 1, last_used: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) { console.error('Error updating toll booth:', error); return; }

      setState(prev => ({
        ...prev,
        tollBooths: prev.tollBooths.map(tb =>
          tb.id === existing.id
            ? { ...tb, amount: parseFloat(data.amount), usageCount: data.usage_count, lastUsed: data.last_used, updatedAt: data.updated_at }
            : tb
        )
      }));
    } else {
      const { data, error } = await supabase
        .from('toll_booths')
        .insert([{ entry_station: entryStation, exit_station: exitStation, amount, usage_count: 1, last_used: new Date().toISOString() }])
        .select()
        .single();

      if (error) { console.error('Error creating toll booth:', error); return; }

      setState(prev => ({
        ...prev,
        tollBooths: [{
          id: data.id,
          entryStation: data.entry_station,
          exitStation: data.exit_station,
          amount: parseFloat(data.amount),
          usageCount: data.usage_count,
          lastUsed: data.last_used,
          createdAt: data.created_at,
          updatedAt: data.updated_at
        }, ...prev.tollBooths]
      }));
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: it });
  };

  const generateMonthlyReport = (personId: string, month: number, year: number): MonthlyReport | null => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return null;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const inRange = (dateStr: string) => {
      const d = new Date(dateStr);
      return d >= startDate && d <= endDate;
    };

    const personTrips = state.trips.filter(t => t.personId === personId && inRange(t.date));
    const personExpenses = state.tripExpenses.filter(e => e.personId === personId && inRange(e.date));
    const personAccommodations = state.accommodations.filter(a => {
      const from = new Date(a.dateFrom);
      const to = new Date(a.dateTo);
      return a.personId === personId && from <= endDate && to >= startDate;
    });

    let totalDistance = 0, totalReimbursement = 0, totalTollFees = 0, totalMealReimbursement = 0;

    personTrips.forEach(trip => {
      const vehicle = state.vehicles.find(v => v.id === trip.vehicleId);
      if (vehicle) {
        const tripDistance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        totalDistance += tripDistance;
        totalReimbursement += tripDistance * vehicle.reimbursementRate;
      }
      if (trip.hasToll && trip.tollAmount) {
        totalTollFees += trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount;
      }
      if (trip.meals && trip.meals.length > 0) {
        trip.meals.forEach(m => { totalMealReimbursement += m.amount; });
      } else if (trip.hasMeal && trip.mealAmount) {
        totalMealReimbursement += trip.mealAmount;
      }
    });

    const totalExpenses = personExpenses.reduce((sum, e) => sum + e.amount, 0);
    const totalAccommodations = personAccommodations.reduce((sum, a) => sum + a.amount, 0);

    if (personTrips.length === 0 && personExpenses.length === 0 && personAccommodations.length === 0) {
      return null;
    }

    return {
      month, year, personId,
      trips: personTrips,
      totalDistance, totalReimbursement, totalTollFees, totalMealReimbursement,
      expenses: personExpenses, totalExpenses,
      accommodations: personAccommodations, totalAccommodations
    };
  };

  const value = {
    state,
    addPerson, updatePerson, deletePerson,
    addVehicle, updateVehicle, deleteVehicle,
    addTrip, updateTrip, deleteTrip,
    addSavedRoute, updateSavedRoute, deleteSavedRoute,
    addRouteDistance, updateRouteDistance, deleteRouteDistance,
    addTripExpense, updateTripExpense, deleteTripExpense,
    addAccommodation, updateAccommodation, deleteAccommodation,
    addFavoriteDestination, updateFavoriteDestination, deleteFavoriteDestination,
    generateMonthlyReport,
    getPerson, getVehicle, getVehiclesForPerson,
    getSavedRoute, getRouteDistance,
    getTollBooth, searchTollStations, handleTollBoothOnTripSave,
    formatDate, loading
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
