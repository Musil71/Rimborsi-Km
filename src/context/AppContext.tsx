import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, Person, Vehicle, Trip, SavedRoute, MonthlyReport, RouteDistance } from '../types';
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
  addTrip: (trip: Omit<Trip, 'id'>) => Promise<void>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  addSavedRoute: (route: Omit<SavedRoute, 'id'>) => Promise<void>;
  updateSavedRoute: (route: SavedRoute) => Promise<void>;
  deleteSavedRoute: (id: string) => Promise<void>;
  addRouteDistance: (routeId: string, distance: Omit<RouteDistance, 'id'>) => Promise<void>;
  updateRouteDistance: (routeId: string, distance: RouteDistance) => Promise<void>;
  deleteRouteDistance: (routeId: string, distanceId: string) => Promise<void>;
  generateMonthlyReport: (personId: string, month: number, year: number) => MonthlyReport | null;
  getPerson: (id: string) => Person | undefined;
  getVehicle: (id: string) => Vehicle | undefined;
  getVehiclesForPerson: (personId: string) => Vehicle[];
  getSavedRoute: (id: string) => SavedRoute | undefined;
  getRouteDistance: (routeId: string, distanceId: string) => RouteDistance | undefined;
  formatDate: (dateString: string) => string;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    people: [],
    vehicles: [],
    trips: [],
    savedRoutes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [peopleRes, vehiclesRes, tripsRes, routesRes, distancesRes] = await Promise.all([
        supabase.from('people').select('*').order('created_at', { ascending: false }),
        supabase.from('vehicles').select('*').order('created_at', { ascending: false }),
        supabase.from('trips').select('*').order('date', { ascending: false }),
        supabase.from('saved_routes').select('*').order('created_at', { ascending: false }),
        supabase.from('route_distances').select('*')
      ]);

      const people: Person[] = (peopleRes.data || []).map(p => ({
        id: p.id,
        name: p.name,
        surname: p.surname || '',
        role: p.role,
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

      const trips: Trip[] = (tripsRes.data || []).map(t => ({
        id: t.id,
        date: t.date,
        personId: t.person_id,
        vehicleId: t.vehicle_id,
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
        tollAmount: t.toll_amount ? parseFloat(t.toll_amount) : undefined
      }));

      const distancesMap = new Map<string, RouteDistance[]>();
      (distancesRes.data || []).forEach(d => {
        if (!distancesMap.has(d.route_id)) {
          distancesMap.set(d.route_id, []);
        }
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

      setState({ people, vehicles, trips, savedRoutes });
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
        role: person.role,
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
        role: data.role,
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
        role: person.role,
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
      trips: prev.trips.filter(t => t.personId !== id)
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

  const addTrip = async (trip: Omit<Trip, 'id'>) => {
    const { data, error } = await supabase
      .from('trips')
      .insert([{
        person_id: trip.personId,
        vehicle_id: trip.vehicleId,
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
        toll_amount: trip.tollAmount
      }])
      .select()
      .single();

    if (error) throw error;

    setState(prev => ({
      ...prev,
      trips: [{
        id: data.id,
        date: data.date,
        personId: data.person_id,
        vehicleId: data.vehicle_id,
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
        tollAmount: data.toll_amount ? parseFloat(data.toll_amount) : undefined
      }, ...prev.trips]
    }));
  };

  const updateTrip = async (trip: Trip) => {
    const { error } = await supabase
      .from('trips')
      .update({
        person_id: trip.personId,
        vehicle_id: trip.vehicleId,
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
        toll_amount: trip.tollAmount
      })
      .eq('id', trip.id);

    if (error) throw error;

    setState(prev => ({
      ...prev,
      trips: prev.trips.map(t => t.id === trip.id ? trip : t)
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
      .insert([{
        name: route.name,
        origin: route.origin,
        destination: route.destination
      }])
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

    setState(prev => ({
      ...prev,
      savedRoutes: [newRoute, ...prev.savedRoutes]
    }));
  };

  const updateSavedRoute = async (route: SavedRoute) => {
    const { error } = await supabase
      .from('saved_routes')
      .update({
        name: route.name,
        origin: route.origin,
        destination: route.destination
      })
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
          ? {
              ...route,
              distances: route.distances.map(d => d.id === distance.id ? distance : d)
            }
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

  const getPerson = (id: string) => state.people.find(p => p.id === id);

  const getVehicle = (id: string) => state.vehicles.find(v => v.id === id);

  const getVehiclesForPerson = (personId: string) =>
    state.vehicles.filter(v => v.personId === personId);

  const getSavedRoute = (id: string) => state.savedRoutes.find(r => r.id === id);

  const getRouteDistance = (routeId: string, distanceId: string) => {
    const route = getSavedRoute(routeId);
    return route?.distances.find(d => d.id === distanceId);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy', { locale: it });
  };

  const generateMonthlyReport = (personId: string, month: number, year: number): MonthlyReport | null => {
    const person = state.people.find(p => p.id === personId);
    if (!person) return null;

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const personTrips = state.trips.filter(trip => {
      const tripDate = new Date(trip.date);
      return trip.personId === personId &&
             tripDate >= startDate &&
             tripDate <= endDate;
    });

    if (personTrips.length === 0) return null;

    let totalDistance = 0;
    let totalReimbursement = 0;
    let totalTollFees = 0;

    personTrips.forEach(trip => {
      const vehicle = state.vehicles.find(v => v.id === trip.vehicleId);
      if (vehicle) {
        const tripDistance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        totalDistance += tripDistance;
        totalReimbursement += tripDistance * vehicle.reimbursementRate;
      }

      if (trip.hasToll && trip.tollAmount) {
        const tollAmount = trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount;
        totalTollFees += tollAmount;
      }
    });

    return {
      month,
      year,
      personId,
      trips: personTrips,
      totalDistance,
      totalReimbursement,
      totalTollFees
    };
  };

  const value = {
    state,
    addPerson,
    updatePerson,
    deletePerson,
    addVehicle,
    updateVehicle,
    deleteVehicle,
    addTrip,
    updateTrip,
    deleteTrip,
    addSavedRoute,
    updateSavedRoute,
    deleteSavedRoute,
    addRouteDistance,
    updateRouteDistance,
    deleteRouteDistance,
    generateMonthlyReport,
    getPerson,
    getVehicle,
    getVehiclesForPerson,
    getSavedRoute,
    getRouteDistance,
    formatDate,
    loading
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
