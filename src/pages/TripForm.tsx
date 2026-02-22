import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Save, ArrowLeft, ExternalLink, MapPin, Calculator, Home, Info, Route, Copy, Plus, Trash2, Utensils, Receipt, Star, Building2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import AutocompleteInput from '../components/AutocompleteInput';
import { useAppContext } from '../context/AppContext';
import { calculateDistance } from '../utils/distanceCalculator';
import { Trip, Role, TripMeal, ExpenseType, EXPENSE_TYPE_LABELS } from '../types';
import { ITFV_OFFICES, DEFAULT_OFFICE } from '../utils/itfvOffices';

interface MealEntry {
  mealType: 'pranzo' | 'cena';
  amount: string;
}

interface TravelExpenseEntry {
  expenseType: ExpenseType;
  fromLocation: string;
  toLocation: string;
  description: string;
  amount: string;
}

interface FormData {
  date: string;
  personId: string;
  vehicleId: string;
  tripRole: Role;
  origin: string;
  destination: string;
  distance: string;
  purpose: string;
  isRoundTrip: boolean;
  savedRouteId: string;
  selectedDistanceId: string;
  selectedOfficeId: string;
  useCustomOrigin: boolean;
  useCustomDestination: boolean;
  hasToll: boolean;
  tollEntryStation: string;
  tollExitStation: string;
  tollAmount: string;
  hasReturnToll: boolean;
  returnTollEntryStation: string;
  returnTollExitStation: string;
  returnTollAmount: string;
  meals: MealEntry[];
  travelExpenses: TravelExpenseEntry[];
  clientId: string;
}

interface FormErrors {
  date?: string;
  personId?: string;
  vehicleId?: string;
  tripRole?: string;
  origin?: string;
  destination?: string;
  distance?: string;
  purpose?: string;
}

const TripForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    state,
    addTrip,
    updateTrip,
    addTripExpense,
    deleteTripExpense,
    getPerson,
    getVehicle,
    getVehiclesForPerson,
    getSavedRoute,
    getTollBooth,
    searchTollStations
  } = useAppContext();

  const isEditing = !!id;
  const trip = isEditing ? state.trips.find((t) => t.id === id) : null;
  const isDuplicating = !!(location.state as any)?.duplicateTrip;
  const duplicateData = isDuplicating ? (location.state as any).duplicateTrip : null;

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    personId: '',
    vehicleId: '',
    tripRole: 'docente',
    origin: DEFAULT_OFFICE.address,
    destination: '',
    distance: '',
    purpose: '',
    isRoundTrip: false,
    savedRouteId: '',
    selectedDistanceId: '',
    selectedOfficeId: DEFAULT_OFFICE.id,
    useCustomOrigin: false,
    useCustomDestination: false,
    hasToll: false,
    tollEntryStation: '',
    tollExitStation: '',
    tollAmount: '',
    hasReturnToll: false,
    returnTollEntryStation: '',
    returnTollExitStation: '',
    returnTollAmount: '',
    meals: [],
    travelExpenses: [],
    clientId: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [availableVehicles, setAvailableVehicles] = useState<{ value: string; label: string; }[]>([]);
  const [availableRoles, setAvailableRoles] = useState<{ value: Role; label: string; }[]>([]);
  const [reimbursement, setReimbursement] = useState<number | null>(null);
  const [tollAmount, setTollAmount] = useState<number | null>(null);
  const [availableDistances, setAvailableDistances] = useState<{ value: string; label: string; }[]>([]);
  const [matchedTollBooth, setMatchedTollBooth] = useState<{ amount: number; usageCount: number } | null>(null);
  const [matchedReturnTollBooth, setMatchedReturnTollBooth] = useState<{ amount: number; usageCount: number } | null>(null);

  useEffect(() => {
    if (trip) {
      const savedRoute = trip.savedRouteId ? getSavedRoute(trip.savedRouteId) : null;
      const person = getPerson(trip.personId);
      const matchedOffice = ITFV_OFFICES.find(o => o.address === trip.origin);
      const personHomeAddress = person?.homeAddress || DEFAULT_OFFICE.address;

      // Update available vehicles and roles first
      if (trip.personId) {
        updateAvailableVehicles(trip.personId);
        updateAvailableRoles(trip.personId);
      }

      // Update available distances if there's a saved route
      if (trip.savedRouteId) {
        updateAvailableDistances(trip.savedRouteId);
      }

      // Set form data after updating available options
      setFormData({
        date: new Date(trip.date).toISOString().split('T')[0],
        personId: trip.personId,
        vehicleId: trip.vehicleId,
        tripRole: trip.tripRole || 'docente',
        origin: trip.origin,
        destination: trip.destination,
        distance: trip.distance.toString(),
        purpose: trip.purpose,
        isRoundTrip: trip.isRoundTrip,
        savedRouteId: trip.savedRouteId || '',
        selectedDistanceId: trip.selectedDistanceId || '',
        selectedOfficeId: matchedOffice ? matchedOffice.id : DEFAULT_OFFICE.id,
        useCustomOrigin: !matchedOffice && trip.origin !== personHomeAddress,
        useCustomDestination: !savedRoute,
        hasToll: trip.hasToll || false,
        tollEntryStation: trip.tollEntryStation || '',
        tollExitStation: trip.tollExitStation || '',
        tollAmount: trip.tollAmount ? trip.tollAmount.toString() : '',
        hasReturnToll: !!(trip.returnTollEntryStation || trip.returnTollExitStation),
        returnTollEntryStation: trip.returnTollEntryStation || '',
        returnTollExitStation: trip.returnTollExitStation || '',
        returnTollAmount: trip.returnTollAmount ? trip.returnTollAmount.toString() : '',
        meals: tripMealsToEntries(trip),
        travelExpenses: tripExpensesToEntries(trip.id),
        clientId: trip.clientId || '',
      });
    }
  }, [trip]);

  // Auto-select vehicle when person changes
  useEffect(() => {
    if (formData.personId && availableVehicles.length > 0) {
      // If no vehicle is selected or the selected vehicle is not available for this person
      if (!formData.vehicleId || !availableVehicles.some(v => v.value === formData.vehicleId)) {
        // Auto-select the first available vehicle
        setFormData(prev => ({ 
          ...prev, 
          vehicleId: availableVehicles[0].value 
        }));
      }
    } else if (!formData.personId) {
      // Clear vehicle selection if no person is selected
      setFormData(prev => ({ ...prev, vehicleId: '' }));
    }
  }, [formData.personId, availableVehicles]);

  useEffect(() => {
    if (isDuplicating && duplicateData) {
      const person = getPerson(duplicateData.personId);

      if (duplicateData.personId) {
        updateAvailableVehicles(duplicateData.personId);
        updateAvailableRoles(duplicateData.personId);
      }

      if (duplicateData.savedRouteId) {
        updateAvailableDistances(duplicateData.savedRouteId);
      }

      setFormData({
        date: new Date().toISOString().split('T')[0],
        personId: duplicateData.personId,
        vehicleId: duplicateData.vehicleId,
        tripRole: duplicateData.tripRole || 'docente',
        origin: duplicateData.origin,
        destination: duplicateData.destination,
        distance: duplicateData.distance.toString(),
        purpose: duplicateData.purpose,
        isRoundTrip: duplicateData.isRoundTrip,
        savedRouteId: duplicateData.savedRouteId || '',
        selectedDistanceId: duplicateData.selectedDistanceId || '',
        useCustomOrigin: person ? duplicateData.origin !== person.homeAddress : false,
        useCustomDestination: !duplicateData.savedRouteId,
        hasToll: duplicateData.hasToll || false,
        tollEntryStation: duplicateData.tollEntryStation || '',
        tollExitStation: duplicateData.tollExitStation || '',
        tollAmount: duplicateData.tollAmount ? duplicateData.tollAmount.toString() : '',
        hasReturnToll: !!(duplicateData.returnTollEntryStation || duplicateData.returnTollExitStation),
        returnTollEntryStation: duplicateData.returnTollEntryStation || '',
        returnTollExitStation: duplicateData.returnTollExitStation || '',
        returnTollAmount: duplicateData.returnTollAmount ? duplicateData.returnTollAmount.toString() : '',
        meals: tripMealsToEntries(duplicateData),
        travelExpenses: [],
        clientId: duplicateData.clientId || '',
      });
    }
  }, [isDuplicating]);

  useEffect(() => {
    if (formData.hasToll && formData.tollEntryStation && formData.tollExitStation) {
      const matched = getTollBooth(formData.tollEntryStation, formData.tollExitStation);
      if (matched) {
        setMatchedTollBooth({ amount: matched.amount, usageCount: matched.usageCount });
        if (!formData.tollAmount || formData.tollAmount === '') {
          setFormData(prev => ({ ...prev, tollAmount: matched.amount.toString() }));
        }
      } else {
        setMatchedTollBooth(null);
      }
    } else {
      setMatchedTollBooth(null);
    }
  }, [formData.tollEntryStation, formData.tollExitStation, formData.hasToll]);

  useEffect(() => {
    if (formData.hasReturnToll && formData.returnTollEntryStation && formData.returnTollExitStation) {
      const matched = getTollBooth(formData.returnTollEntryStation, formData.returnTollExitStation);
      if (matched) {
        setMatchedReturnTollBooth({ amount: matched.amount, usageCount: matched.usageCount });
        if (!formData.returnTollAmount || formData.returnTollAmount === '') {
          setFormData(prev => ({ ...prev, returnTollAmount: matched.amount.toString() }));
        }
      } else {
        setMatchedReturnTollBooth(null);
      }
    } else {
      setMatchedReturnTollBooth(null);
    }
  }, [formData.returnTollEntryStation, formData.returnTollExitStation, formData.hasReturnToll]);

  useEffect(() => {
    calculateReimbursement();
    calculateTollAmount();
  }, [formData.distance, formData.vehicleId, formData.isRoundTrip, formData.tollAmount, formData.hasToll, formData.returnTollAmount, formData.hasReturnToll, formData.meals]);

  const calculateReimbursement = () => {
    if (!formData.vehicleId || !formData.distance) {
      setReimbursement(null);
      return;
    }

    const vehicle = getVehicle(formData.vehicleId);
    if (!vehicle) {
      setReimbursement(null);
      return;
    }

    const distance = parseFloat(formData.distance);
    if (isNaN(distance)) {
      setReimbursement(null);
      return;
    }

    const actualDistance = formData.isRoundTrip ? distance * 2 : distance;
    const amount = actualDistance * vehicle.reimbursementRate;
    setReimbursement(amount);
  };

  const calculateTollAmount = () => {
    if (!formData.hasToll || !formData.tollAmount) {
      setTollAmount(null);
      return;
    }

    const toll = parseFloat(formData.tollAmount);
    if (isNaN(toll)) {
      setTollAmount(null);
      return;
    }

    let total = toll;
    if (formData.isRoundTrip) {
      if (formData.hasReturnToll && formData.returnTollAmount) {
        const returnToll = parseFloat(formData.returnTollAmount);
        total += isNaN(returnToll) ? toll : returnToll;
      } else {
        total += toll;
      }
    }
    setTollAmount(total);
  };

  const updateAvailableVehicles = (personId: string) => {
    const vehicles = getVehiclesForPerson(personId);
    setAvailableVehicles(
      vehicles.map((v) => ({
        value: v.id,
        label: `${v.make} ${v.model} (${v.plate}) - ${v.reimbursementRate.toFixed(2)} €/km`,
      }))
    );
  };

  const updateAvailableRoles = (personId: string) => {
    const person = getPerson(personId);
    if (!person) {
      setAvailableRoles([]);
      return;
    }

    const roles: { value: Role; label: string; }[] = [];
    if (person.isDocente) roles.push({ value: 'docente', label: 'Docente' });
    if (person.isAmministratore) roles.push({ value: 'amministratore', label: 'Amministratore' });
    if (person.isDipendente) roles.push({ value: 'dipendente', label: 'Dipendente' });

    setAvailableRoles(roles);

    // Auto-select first available role if current role is not available
    if (roles.length > 0 && !roles.some(r => r.value === formData.tripRole)) {
      setFormData(prev => ({ ...prev, tripRole: roles[0].value }));
    }
  };

  const updateAvailableDistances = (routeId: string) => {
    const route = getSavedRoute(routeId);
    if (route) {
      setAvailableDistances(
        route.distances.map((d) => ({
          value: d.id,
          label: `${d.label} (${d.distance.toFixed(1)} km)`,
        }))
      );
    } else {
      setAvailableDistances([]);
    }
  };

  const tripExpensesToEntries = (tripId: string): TravelExpenseEntry[] => {
    return state.tripExpenses
      .filter(e => e.tripId === tripId)
      .map(e => ({
        expenseType: e.expenseType,
        fromLocation: e.fromLocation,
        toLocation: e.toLocation,
        description: e.description,
        amount: e.amount.toString(),
      }));
  };

  const tripMealsToEntries = (trip: Partial<Trip>): MealEntry[] => {
    if (trip.meals && trip.meals.length > 0) {
      return trip.meals.map(m => ({ mealType: m.mealType, amount: m.amount.toString() }));
    }
    if (trip.hasMeal && trip.mealAmount) {
      return [{ mealType: trip.mealType || 'pranzo', amount: trip.mealAmount.toString() }];
    }
    return [];
  };

  const addMeal = () => {
    const usedTypes = formData.meals.map(m => m.mealType);
    const nextType: 'pranzo' | 'cena' = !usedTypes.includes('pranzo') ? 'pranzo' : 'cena';
    setFormData(prev => ({
      ...prev,
      meals: [...prev.meals, { mealType: nextType, amount: '' }]
    }));
  };

  const removeMeal = (index: number) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index)
    }));
  };

  const updateMeal = (index: number, field: keyof MealEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      meals: prev.meals.map((m, i) => i === index ? { ...m, [field]: value } : m)
    }));
  };

  const addTravelExpense = () => {
    setFormData(prev => ({
      ...prev,
      travelExpenses: [...prev.travelExpenses, {
        expenseType: 'taxi',
        fromLocation: '',
        toLocation: '',
        description: '',
        amount: '',
      }]
    }));
  };

  const removeTravelExpense = (index: number) => {
    setFormData(prev => ({
      ...prev,
      travelExpenses: prev.travelExpenses.filter((_, i) => i !== index)
    }));
  };

  const updateTravelExpense = (index: number, field: keyof TravelExpenseEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      travelExpenses: prev.travelExpenses.map((e, i) => i === index ? { ...e, [field]: value } : e)
    }));
  };

  const needsRoute = (type: ExpenseType) => type === 'treno' || type === 'supplemento_treno' || type === 'aereo' || type === 'mezzi_pubblici';

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.date) {
      newErrors.date = 'La data è obbligatoria';
    }

    if (!formData.personId) {
      newErrors.personId = 'La persona è obbligatoria';
    }

    if (!formData.vehicleId) {
      newErrors.vehicleId = 'Il veicolo è obbligatorio';
    }

    if (!formData.tripRole) {
      newErrors.tripRole = 'Il ruolo è obbligatorio';
    }

    if (!formData.origin.trim()) {
      newErrors.origin = "L'indirizzo di origine è obbligatorio";
    }

    if (!formData.destination.trim()) {
      newErrors.destination = "L'indirizzo di destinazione è obbligatorio";
    }

    const distance = parseFloat(formData.distance);
    if (isNaN(distance) || distance <= 0) {
      newErrors.distance = 'La distanza deve essere un numero positivo';
    }

    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Lo scopo della trasferta è obbligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;

    if (name === 'personId' && value) {
      updateAvailableVehicles(value);
      updateAvailableRoles(value);

      const person = getPerson(value);
      if (person && person.homeAddress && !formData.useCustomOrigin) {
        setFormData(prev => ({
          ...prev,
          personId: value,
          origin: person.homeAddress || DEFAULT_OFFICE.address
        }));
        return;
      }
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'useCustomOrigin' && !checked) {
        const person = formData.personId ? getPerson(formData.personId) : null;
        const office = ITFV_OFFICES.find(o => o.id === formData.selectedOfficeId) || DEFAULT_OFFICE;
        const defaultOrigin = person?.homeAddress || office.address;
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          origin: defaultOrigin
        }));
      } else if (name === 'useCustomDestination') {
        setFormData(prev => ({
          ...prev,
          [name]: checked,
          savedRouteId: '',
          selectedDistanceId: '',
          destination: '',
          distance: '',
        }));
        setAvailableDistances([]);
      } else {
        setFormData(prev => ({ ...prev, [name]: checked }));
      }
    } else if (name === 'selectedOfficeId') {
      const office = ITFV_OFFICES.find(o => o.id === value) || DEFAULT_OFFICE;
      setFormData(prev => ({
        ...prev,
        selectedOfficeId: value,
        origin: office.address,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSavedRouteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routeId = e.target.value;
    const route = getSavedRoute(routeId);

    if (route) {
      updateAvailableDistances(routeId);
      setFormData(prev => ({
        ...prev,
        savedRouteId: routeId,
        destination: route.destination,
        selectedDistanceId: '',
        distance: '',
      }));
    } else {
      setAvailableDistances([]);
      setFormData(prev => ({
        ...prev,
        savedRouteId: '',
        selectedDistanceId: '',
        destination: '',
        distance: '',
      }));
    }
  };

  const handleDistanceOptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const distanceId = e.target.value;
    const route = getSavedRoute(formData.savedRouteId);

    if (route && distanceId) {
      const selectedDistance = route.distances.find(d => d.id === distanceId);
      if (selectedDistance) {
        const hasTollData = !!(selectedDistance.tollEntryStation || selectedDistance.tollExitStation || selectedDistance.tollAmount);
        setFormData(prev => ({
          ...prev,
          selectedDistanceId: distanceId,
          distance: selectedDistance.distance.toString(),
          hasToll: hasTollData,
          tollEntryStation: selectedDistance.tollEntryStation || '',
          tollExitStation: selectedDistance.tollExitStation || '',
          tollAmount: selectedDistance.tollAmount ? selectedDistance.tollAmount.toString() : '',
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        selectedDistanceId: '',
        distance: '',
        hasToll: false,
        tollEntryStation: '',
        tollExitStation: '',
        tollAmount: '',
      }));
    }
  };

  const getSuggestions = async (query: string) => {
    const stations = await searchTollStations(query);
    return stations.map(station => ({ value: station }));
  };

  const handleOpenGoogleMaps = () => {
    try {
      calculateDistance(formData.origin, formData.destination);
    } catch (error) {
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const validMeals: Omit<TripMeal, 'id' | 'tripId'>[] = formData.meals
      .filter(m => m.amount && parseFloat(m.amount) > 0)
      .map(m => ({ mealType: m.mealType, amount: parseFloat(m.amount) }));

    const tripData = {
      date: formData.date,
      personId: formData.personId,
      vehicleId: formData.vehicleId,
      tripRole: formData.tripRole,
      origin: formData.origin,
      destination: formData.destination,
      distance: parseFloat(formData.distance),
      purpose: formData.purpose,
      isRoundTrip: formData.isRoundTrip,
      savedRouteId: formData.savedRouteId || undefined,
      selectedDistanceId: formData.selectedDistanceId || undefined,
      hasToll: formData.hasToll,
      tollEntryStation: formData.hasToll ? formData.tollEntryStation : undefined,
      tollExitStation: formData.hasToll ? formData.tollExitStation : undefined,
      tollAmount: formData.hasToll && formData.tollAmount ? parseFloat(formData.tollAmount) : undefined,
      returnTollEntryStation: (formData.hasToll && formData.isRoundTrip && formData.hasReturnToll) ? formData.returnTollEntryStation : undefined,
      returnTollExitStation: (formData.hasToll && formData.isRoundTrip && formData.hasReturnToll) ? formData.returnTollExitStation : undefined,
      returnTollAmount: (formData.hasToll && formData.isRoundTrip && formData.hasReturnToll && formData.returnTollAmount) ? parseFloat(formData.returnTollAmount) : undefined,
      clientId: formData.clientId || undefined,
    };

    const validExpenses = formData.travelExpenses.filter(e => e.amount && parseFloat(e.amount) > 0);

    if (isEditing && trip) {
      await updateTrip({ id: trip.id, ...tripData }, validMeals);
      const existing = state.tripExpenses.filter(e => e.tripId === trip.id);
      for (const e of existing) { await deleteTripExpense(e.id); }
      for (const e of validExpenses) {
        await addTripExpense({
          personId: formData.personId,
          tripId: trip.id,
          date: formData.date,
          expenseType: e.expenseType,
          description: e.description,
          fromLocation: e.fromLocation,
          toLocation: e.toLocation,
          amount: parseFloat(e.amount),
          notes: '',
        });
      }
    } else {
      await addTrip(tripData, validMeals);
      const newTrip = state.trips[0];
      if (newTrip && validExpenses.length > 0) {
        for (const e of validExpenses) {
          await addTripExpense({
            personId: formData.personId,
            tripId: newTrip.id,
            date: formData.date,
            expenseType: e.expenseType,
            description: e.description,
            fromLocation: e.fromLocation,
            toLocation: e.toLocation,
            amount: parseFloat(e.amount),
            notes: '',
          });
        }
      }
    }

    navigate('/tragitti');
  };

  const canCalculateDistance = formData.origin.trim() && formData.destination.trim();
  const hasAvailableVehicles = availableVehicles.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/tragitti')}
        >
          Torna all'elenco
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Modifica Trasferta' : isDuplicating ? 'Duplica Trasferta' : 'Nuova Trasferta'}
        </h1>
      </div>

      {isDuplicating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Copy className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-800 mb-1">Creazione da duplicato</h3>
              <p className="text-sm text-blue-700">
                Stai creando una nuova trasferta basata su una esistente. La data è stata aggiornata a oggi.
                Modifica i dati necessari e salva per creare la nuova trasferta.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="date"
              name="date"
              label="Data"
              type="date"
              value={formData.date}
              onChange={handleChange}
              error={errors.date}
              required
            />

            <Select
              id="personId"
              name="personId"
              label="Persona"
              options={state.people.map(p => {
                const roles = [];
                if (p.isDocente) roles.push('D');
                if (p.isAmministratore) roles.push('A');
                if (p.isDipendente) roles.push('Dip');
                return {
                  value: p.id,
                  label: `${p.name} ${p.surname} (${roles.join(', ')})`
                };
              })}
              value={formData.personId}
              onChange={handleChange}
              error={errors.personId}
              required
            />
          </div>

          {/* Role selection */}
          {formData.personId && availableRoles.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <Select
                id="tripRole"
                name="tripRole"
                label="In qualità di"
                options={availableRoles}
                value={formData.tripRole}
                onChange={handleChange}
                error={errors.tripRole}
                required
              />
              <p className="text-xs text-blue-600 mt-1">
                Seleziona il ruolo in cui {state.people.find(p => p.id === formData.personId)?.name} ha svolto questa trasferta
              </p>
            </div>
          )}

          {/* Vehicle selection with automatic selection */}
          <div className="space-y-2">
            <Select
              id="vehicleId"
              name="vehicleId"
              label="Veicolo"
              options={availableVehicles}
              value={formData.vehicleId}
              onChange={handleChange}
              error={errors.vehicleId}
              required
              disabled={!formData.personId}
            />
            
            {formData.personId && !hasAvailableVehicles && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
                <div className="flex items-start">
                  <Info className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-amber-800">
                      Nessun veicolo registrato per questa persona.{' '}
                      <a 
                        href="/veicoli/nuovo" 
                        className="font-medium underline hover:text-amber-900"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Aggiungi un veicolo
                      </a>{' '}
                      prima di continuare.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {formData.vehicleId && (
              <div className="bg-teal-50 border border-teal-200 rounded-md p-3">
                <div className="flex items-center">
                  <Info className="h-4 w-4 text-teal-500 mr-2" />
                  <span className="text-sm text-teal-700">
                    Veicolo selezionato automaticamente per{' '}
                    {state.people.find(p => p.id === formData.personId)?.name}{' '}
                    {state.people.find(p => p.id === formData.personId)?.surname}
                  </span>
                </div>
              </div>
            )}
          </div>

          {state.clients.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center mb-2">
                <Building2 className="h-5 w-5 text-blue-500 mr-2" />
                <span className="font-medium text-blue-800">Cliente (opzionale)</span>
              </div>
              <Select
                id="clientId"
                name="clientId"
                label=""
                options={[
                  { value: '', label: 'Nessun cliente / uso interno' },
                  ...state.clients.map(c => ({ value: c.id, label: c.name }))
                ]}
                value={formData.clientId}
                onChange={handleChange}
              />
              <p className="text-xs text-blue-600 mt-1">
                Seleziona il cliente per cui si svolge la trasferta (es. Villaggio SOS, Comune di Venezia)
              </p>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <div className="flex items-center mb-3">
              <Home className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">Sede di Partenza</span>
            </div>
            {!formData.useCustomOrigin && (
              <div className="mb-3 space-y-2">
                {ITFV_OFFICES.map(office => (
                  <label key={office.id} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="selectedOfficeId"
                      value={office.id}
                      checked={formData.selectedOfficeId === office.id}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className="text-sm text-blue-800">
                      <span className="font-medium">{office.name}</span>
                      <span className="text-blue-600 ml-1">— {office.address}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex items-center mb-3">
              <input
                id="useCustomOrigin"
                name="useCustomOrigin"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.useCustomOrigin}
                onChange={handleChange}
              />
              <label htmlFor="useCustomOrigin" className="ml-2 block text-sm text-blue-700">
                Usa un indirizzo di partenza personalizzato
              </label>
            </div>
            {formData.useCustomOrigin && (
              <Input
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                error={errors.origin}
                placeholder="Inserisci l'indirizzo di partenza"
                required
              />
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <div className="flex items-center mb-3">
              <MapPin className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">Indirizzo di Destinazione</span>
            </div>

            {state.favoriteDestinations.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <Star className="h-4 w-4 text-amber-500 mr-1.5" />
                  <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Destinazioni abituali</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {state.favoriteDestinations.map(dest => {
                    const isSelected = formData.destination === dest.address && formData.useCustomDestination;
                    return (
                      <button
                        key={dest.id}
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            destination: dest.address,
                            distance: String(dest.defaultDistance),
                            useCustomDestination: true,
                            savedRouteId: '',
                            selectedDistanceId: '',
                          }));
                          if (errors.destination) setErrors(prev => ({ ...prev, destination: undefined }));
                        }}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-white shadow-sm'
                            : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-400'
                        }`}
                        title={dest.address}
                      >
                        <span>{dest.name}</span>
                        <span className={`ml-1.5 text-xs ${isSelected ? 'text-amber-100' : 'text-amber-500'}`}>
                          {dest.defaultDistance} km
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {state.savedRoutes.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center mb-2">
                    <Route className="h-4 w-4 text-blue-500 mr-1.5" />
                    <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Percorsi salvati</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {state.savedRoutes.map(route => {
                      const isSelected = formData.savedRouteId === route.id && !formData.useCustomDestination;
                      return (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              savedRouteId: route.id,
                              destination: route.destination,
                              useCustomDestination: false,
                              selectedDistanceId: '',
                            }));
                            updateAvailableDistances(route.id);
                            if (errors.destination) setErrors(prev => ({ ...prev, destination: undefined }));
                          }}
                          className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500 text-white shadow-sm'
                              : 'bg-white border-blue-200 text-blue-800 hover:bg-blue-50 hover:border-blue-400'
                          }`}
                        >
                          <span>{route.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center">
                <input
                  id="useCustomDestination"
                  name="useCustomDestination"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  checked={formData.useCustomDestination}
                  onChange={handleChange}
                />
                <label htmlFor="useCustomDestination" className="ml-2 block text-sm text-blue-700">
                  Inserisci manualmente l'indirizzo di destinazione
                </label>
              </div>

              {formData.useCustomDestination && (
                <Input
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  error={errors.destination}
                  placeholder="Inserisci l'indirizzo di destinazione"
                  required
                />
              )}
            </div>
          </div>

          {/* Distance Selection for Saved Routes */}
          {formData.savedRouteId && !formData.useCustomDestination && availableDistances.length > 0 && (
            <div className="bg-teal-50 p-4 rounded-lg border border-teal-100 mb-4">
              <div className="flex items-center mb-3">
                <Route className="h-5 w-5 text-teal-500 mr-2" />
                <span className="font-medium text-teal-800">Opzioni di Percorso</span>
              </div>
              <Select
                id="selectedDistanceId"
                name="selectedDistanceId"
                label="Seleziona il tipo di percorso"
                options={availableDistances}
                value={formData.selectedDistanceId}
                onChange={handleDistanceOptionChange}
                required
              />
              <p className="text-xs text-teal-600 mt-1">
                Scegli l'opzione di percorso che intendi utilizzare (es. strada normale, autostrada)
              </p>
            </div>
          )}

          {/* Google Maps Distance Calculator - only show if using custom destination or no distance selected */}
          {(formData.useCustomDestination || (!formData.selectedDistanceId && formData.savedRouteId)) && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
              <div className="flex items-start">
                <Info className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                <div className="flex-grow">
                  <h3 className="font-medium text-green-800 mb-2">Calcolo Distanza con Google Maps</h3>
                  <p className="text-sm text-green-700 mb-3">
                    Clicca il pulsante qui sotto per aprire Google Maps con il percorso tra gli indirizzi inseriti. 
                    Potrai vedere la distanza esatta e inserirla manualmente nel campo sottostante.
                  </p>
                  <Button
                    type="button"
                    variant="success"
                    size="sm"
                    icon={<ExternalLink size={16} />}
                    onClick={handleOpenGoogleMaps}
                    disabled={!canCalculateDistance}
                  >
                    Apri Google Maps
                  </Button>
                  {!canCalculateDistance && (
                    <p className="text-xs text-green-600 mt-1">
                      Inserisci prima gli indirizzi di origine e destinazione
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Input
            id="distance"
            name="distance"
            label="Distanza (km)"
            type="number"
            step="0.1"
            min="0.1"
            value={formData.distance}
            onChange={handleChange}
            error={errors.distance}
            placeholder={formData.selectedDistanceId ? "Distanza selezionata automaticamente" : "Inserisci la distanza da Google Maps"}
            required
            disabled={!!formData.selectedDistanceId}
          />

          <div className="flex items-center mb-4">
            <input
              id="isRoundTrip"
              name="isRoundTrip"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              checked={formData.isRoundTrip}
              onChange={handleChange}
            />
            <label htmlFor="isRoundTrip" className="ml-2 block text-sm text-gray-900">
              Viaggio di andata e ritorno (A/R)
            </label>
          </div>

          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
            <div className="mb-3">
              <div className="flex items-center space-x-2">
                <input
                  id="hasToll"
                  name="hasToll"
                  type="checkbox"
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                  checked={formData.hasToll}
                  onChange={handleChange}
                />
                <label htmlFor="hasToll" className="text-sm font-medium text-amber-900">
                  Questa trasferta include pedaggi autostradali
                </label>
              </div>
            </div>

            {formData.hasToll && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-100 rounded-md border border-amber-200">
                  <div className="flex items-start">
                    <Info className="h-4 w-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-grow">
                      <p className="text-xs text-amber-800">
                        I dati del pedaggio possono essere modificati per questo viaggio specifico.{' '}
                        <a
                          href="https://www.infoviaggiando.it/pedaggi"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-amber-900 inline-flex items-center"
                        >
                          Consulta qui gli importi aggiornati
                          <ExternalLink size={12} className="ml-1" />
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <AutocompleteInput
                    id="tollEntryStation"
                    name="tollEntryStation"
                    label="Casello di Entrata"
                    value={formData.tollEntryStation}
                    onChange={handleChange}
                    getSuggestions={getSuggestions}
                    placeholder="es. Treviso"
                  />
                  <AutocompleteInput
                    id="tollExitStation"
                    name="tollExitStation"
                    label="Casello di Uscita"
                    value={formData.tollExitStation}
                    onChange={handleChange}
                    getSuggestions={getSuggestions}
                    placeholder="es. Vicenza"
                  />
                  <div>
                    <Input
                      id="tollAmount"
                      name="tollAmount"
                      label="Importo Pedaggio (€)"
                      type="number"
                      step="0.10"
                      min="0"
                      value={formData.tollAmount}
                      onChange={handleChange}
                      placeholder="es. 3.50"
                    />
                    {matchedTollBooth && (
                      <div className="mt-1 flex items-center text-xs text-green-600">
                        <Info className="h-3 w-3 mr-1" />
                        <span>
                          Importo salvato: {matchedTollBooth.amount.toFixed(2)} € (usato {matchedTollBooth.usageCount} {matchedTollBooth.usageCount === 1 ? 'volta' : 'volte'})
                        </span>
                      </div>
                    )}
                    {!matchedTollBooth && formData.tollEntryStation && formData.tollExitStation && (
                      <div className="mt-1 flex items-center text-xs text-blue-600">
                        <Info className="h-3 w-3 mr-1" />
                        <span>Nuova combinazione caselli</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {formData.hasToll && formData.isRoundTrip && (
            <div className="bg-amber-50 p-4 rounded-lg border border-amber-100 mb-4">
              <div className="mb-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="hasReturnToll"
                    name="hasReturnToll"
                    type="checkbox"
                    className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                    checked={formData.hasReturnToll}
                    onChange={handleChange}
                  />
                  <label htmlFor="hasReturnToll" className="text-sm font-medium text-amber-900">
                    Il ritorno ha caselli diversi dall'andata
                  </label>
                </div>
                <p className="text-xs text-amber-700 mt-1 ml-6">
                  Se non spuntato, il pedaggio del ritorno sarà uguale all'andata
                </p>
              </div>

              {formData.hasReturnToll && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-amber-800">Caselli del ritorno</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <AutocompleteInput
                      id="returnTollEntryStation"
                      name="returnTollEntryStation"
                      label="Casello Entrata Ritorno"
                      value={formData.returnTollEntryStation}
                      onChange={handleChange}
                      getSuggestions={getSuggestions}
                      placeholder="es. Vicenza"
                    />
                    <AutocompleteInput
                      id="returnTollExitStation"
                      name="returnTollExitStation"
                      label="Casello Uscita Ritorno"
                      value={formData.returnTollExitStation}
                      onChange={handleChange}
                      getSuggestions={getSuggestions}
                      placeholder="es. Treviso"
                    />
                    <div>
                      <Input
                        id="returnTollAmount"
                        name="returnTollAmount"
                        label="Importo Pedaggio Ritorno (€)"
                        type="number"
                        step="0.10"
                        min="0"
                        value={formData.returnTollAmount}
                        onChange={handleChange}
                        placeholder="es. 3.50"
                      />
                      {matchedReturnTollBooth && (
                        <div className="mt-1 flex items-center text-xs text-green-600">
                          <Info className="h-3 w-3 mr-1" />
                          <span>
                            Importo salvato: {matchedReturnTollBooth.amount.toFixed(2)} € (usato {matchedReturnTollBooth.usageCount} {matchedReturnTollBooth.usageCount === 1 ? 'volta' : 'volte'})
                          </span>
                        </div>
                      )}
                      {!matchedReturnTollBooth && formData.returnTollEntryStation && formData.returnTollExitStation && (
                        <div className="mt-1 flex items-center text-xs text-blue-600">
                          <Info className="h-3 w-3 mr-1" />
                          <span>Nuova combinazione caselli</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Receipt className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-900">Spese di Trasporto</span>
                <span className="text-xs text-gray-500">(treno, aereo, taxi, bus, parcheggio, altro)</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={addTravelExpense}
              >
                Aggiungi spesa
              </Button>
            </div>

            {formData.travelExpenses.length === 0 && (
              <p className="text-sm text-gray-500 italic">
                Nessuna spesa aggiunta. Clicca "Aggiungi spesa" per inserire treno, aereo, taxi, parcheggio, ecc.
              </p>
            )}

            {formData.travelExpenses.length > 0 && (
              <div className="space-y-3">
                {formData.travelExpenses.map((expense, index) => (
                  <div key={index} className="bg-white rounded-md p-3 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1 mr-3">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo di spesa</label>
                        <select
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                          value={expense.expenseType}
                          onChange={e => updateTravelExpense(index, 'expenseType', e.target.value)}
                        >
                          {(Object.keys(EXPENSE_TYPE_LABELS) as ExpenseType[]).map(t => (
                            <option key={t} value={t}>{EXPENSE_TYPE_LABELS[t]}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-28">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Importo (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                          value={expense.amount}
                          onChange={e => updateTravelExpense(index, 'amount', e.target.value)}
                          placeholder="0.00"
                        />
                      </div>
                      <button
                        type="button"
                        className="ml-2 mt-5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={() => removeTravelExpense(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    {needsRoute(expense.expenseType) && (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Da</label>
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                            value={expense.fromLocation}
                            onChange={e => updateTravelExpense(index, 'fromLocation', e.target.value)}
                            placeholder="es. Treviso"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">A</label>
                          <input
                            type="text"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                            value={expense.toLocation}
                            onChange={e => updateTravelExpense(index, 'toLocation', e.target.value)}
                            placeholder="es. Milano"
                          />
                        </div>
                      </div>
                    )}
                    {(expense.expenseType === 'taxi' || expense.expenseType === 'parcheggio' || expense.expenseType === 'altro') && (
                      <div className="mt-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Descrizione</label>
                        <input
                          type="text"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring-gray-500 sm:text-sm"
                          value={expense.description}
                          onChange={e => updateTravelExpense(index, 'description', e.target.value)}
                          placeholder={expense.expenseType === 'altro' ? 'Specificare...' : 'Dettagli opzionali'}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-100 mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Utensils className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-900">Rimborso Pasti</span>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                icon={<Plus size={14} />}
                onClick={addMeal}
                disabled={formData.meals.length >= 2}
              >
                Aggiungi pasto
              </Button>
            </div>

            {formData.meals.length === 0 && (
              <p className="text-sm text-green-700 italic">
                Nessun pasto aggiunto. Clicca "Aggiungi pasto" per inserire pranzo o cena.
              </p>
            )}

            {formData.meals.length > 0 && (
              <div className="space-y-3">
                {formData.meals.map((meal, index) => {
                  const otherType = formData.meals.find((m, i) => i !== index)?.mealType;
                  const availableTypes = [
                    { value: 'pranzo', label: 'Pranzo' },
                    { value: 'cena', label: 'Cena' },
                  ].filter(t => t.value === meal.mealType || t.value !== otherType);

                  return (
                    <div key={index} className="flex items-end gap-3 bg-white rounded-md p-3 border border-green-200">
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo di pasto</label>
                        <select
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                          value={meal.mealType}
                          onChange={e => updateMeal(index, 'mealType', e.target.value)}
                        >
                          {availableTypes.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-600 mb-1">Importo (€)</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                          value={meal.amount}
                          onChange={e => updateMeal(index, 'amount', e.target.value)}
                          placeholder="es. 15.00"
                        />
                      </div>
                      <button
                        type="button"
                        className="mb-0.5 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        onClick={() => removeMeal(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {reimbursement !== null && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Calculator className="h-5 w-5 text-primary-500 mr-3 mt-1" />
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-primary-800 mb-2">Riepilogo Spese di Trasferta</h3>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-primary-700">Rimborso Chilometrico:</span>
                      <span className="text-lg font-semibold text-primary-900">
                        {reimbursement.toFixed(2)} €
                      </span>
                    </div>
                    <p className="text-xs text-primary-600">
                      ({formData.isRoundTrip ? parseFloat(formData.distance) * 2 : formData.distance} km totali)
                    </p>

                    {tollAmount !== null && (
                      <>
                        <div className="border-t border-primary-200 pt-2 flex justify-between items-center">
                          <span className="text-sm text-primary-700">Pedaggi Autostradali:</span>
                          <span className="text-lg font-semibold text-primary-900">
                            {tollAmount.toFixed(2)} €
                          </span>
                        </div>
                        {formData.tollEntryStation && formData.tollExitStation && (
                          <p className="text-xs text-primary-600">
                            {formData.tollEntryStation} → {formData.tollExitStation}
                            {formData.isRoundTrip && ' (A/R)'}
                          </p>
                        )}
                      </>
                    )}

                    {formData.meals.filter(m => m.amount && parseFloat(m.amount) > 0).map((meal, index) => (
                      <div key={index}>
                        <div className="border-t border-primary-200 pt-2 flex justify-between items-center">
                          <span className="text-sm text-primary-700">
                            Rimborso {meal.mealType === 'pranzo' ? 'Pranzo' : 'Cena'}:
                          </span>
                          <span className="text-lg font-semibold text-primary-900">
                            {parseFloat(meal.amount).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    ))}

                    {formData.travelExpenses.filter(e => e.amount && parseFloat(e.amount) > 0).map((expense, index) => (
                      <div key={index}>
                        <div className="border-t border-primary-200 pt-2 flex justify-between items-center">
                          <span className="text-sm text-primary-700">{EXPENSE_TYPE_LABELS[expense.expenseType]}:</span>
                          <span className="text-lg font-semibold text-primary-900">
                            {parseFloat(expense.amount).toFixed(2)} €
                          </span>
                        </div>
                      </div>
                    ))}

                    <div className="border-t-2 border-primary-300 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-primary-800">Totale Generale:</span>
                      <span className="text-xl font-bold text-primary-900">
                        {(
                          reimbursement +
                          (tollAmount || 0) +
                          formData.meals.reduce((sum, m) => sum + (m.amount && parseFloat(m.amount) > 0 ? parseFloat(m.amount) : 0), 0) +
                          formData.travelExpenses.reduce((sum, e) => sum + (e.amount && parseFloat(e.amount) > 0 ? parseFloat(e.amount) : 0), 0)
                        ).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Scopo della trasferta
            </label>
            <textarea
              id="purpose"
              name="purpose"
              rows={3}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Descrivi lo scopo della trasferta"
              required
            ></textarea>
            {errors.purpose && <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>}
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={18} />}
              disabled={!hasAvailableVehicles && formData.personId}
            >
              {isEditing ? 'Salva Modifiche' : 'Registra Trasferta'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TripForm;