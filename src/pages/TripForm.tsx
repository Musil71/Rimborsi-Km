import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, ExternalLink, MapPin, Calculator, Home, Info, Route } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import { useAppContext } from '../context/AppContext';
import { calculateDistance } from '../utils/distanceCalculator';
import { Trip } from '../types';

const DEFAULT_ORIGIN = 'Via della Quercia 2/B, 31100 Treviso';

interface FormData {
  date: string;
  personId: string;
  vehicleId: string;
  origin: string;
  destination: string;
  distance: string;
  purpose: string;
  isRoundTrip: boolean;
  savedRouteId: string;
  selectedDistanceId: string;
  useCustomOrigin: boolean;
  useCustomDestination: boolean;
  hasToll: boolean;
  tollEntryStation: string;
  tollExitStation: string;
  tollAmount: string;
}

interface FormErrors {
  date?: string;
  personId?: string;
  vehicleId?: string;
  origin?: string;
  destination?: string;
  distance?: string;
  purpose?: string;
}

const TripForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { 
    state, 
    addTrip, 
    updateTrip, 
    getPerson, 
    getVehicle,
    getVehiclesForPerson, 
    getSavedRoute 
  } = useAppContext();

  const isEditing = !!id;
  const trip = isEditing ? state.trips.find((t) => t.id === id) : null;

  const [formData, setFormData] = useState<FormData>({
    date: new Date().toISOString().split('T')[0],
    personId: '',
    vehicleId: '',
    origin: DEFAULT_ORIGIN,
    destination: '',
    distance: '',
    purpose: '',
    isRoundTrip: false,
    savedRouteId: '',
    selectedDistanceId: '',
    useCustomOrigin: false,
    useCustomDestination: false,
    hasToll: false,
    tollEntryStation: '',
    tollExitStation: '',
    tollAmount: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [availableVehicles, setAvailableVehicles] = useState<{ value: string; label: string; }[]>([]);
  const [reimbursement, setReimbursement] = useState<number | null>(null);
  const [tollAmount, setTollAmount] = useState<number | null>(null);
  const [availableDistances, setAvailableDistances] = useState<{ value: string; label: string; }[]>([]);

  useEffect(() => {
    if (trip) {
      const savedRoute = trip.savedRouteId ? getSavedRoute(trip.savedRouteId) : null;
      const person = getPerson(trip.personId);
      const personHomeAddress = person?.homeAddress || DEFAULT_ORIGIN;

      // Update available vehicles first
      if (trip.personId) {
        updateAvailableVehicles(trip.personId);
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
        origin: trip.origin,
        destination: trip.destination,
        distance: trip.distance.toString(),
        purpose: trip.purpose,
        isRoundTrip: trip.isRoundTrip,
        savedRouteId: trip.savedRouteId || '',
        selectedDistanceId: trip.selectedDistanceId || '',
        useCustomOrigin: trip.origin !== personHomeAddress,
        useCustomDestination: !savedRoute,
        hasToll: trip.hasToll || false,
        tollEntryStation: trip.tollEntryStation || '',
        tollExitStation: trip.tollExitStation || '',
        tollAmount: trip.tollAmount ? trip.tollAmount.toString() : '',
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
    calculateReimbursement();
    calculateTollAmount();
  }, [formData.distance, formData.vehicleId, formData.isRoundTrip, formData.tollAmount, formData.hasToll]);

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

    const actualToll = formData.isRoundTrip ? toll * 2 : toll;
    setTollAmount(actualToll);
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
      newErrors.purpose = 'Lo scopo del viaggio è obbligatorio';
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

      const person = getPerson(value);
      if (person && person.homeAddress && !formData.useCustomOrigin) {
        setFormData(prev => ({
          ...prev,
          personId: value,
          origin: person.homeAddress || DEFAULT_ORIGIN
        }));
        return;
      }
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      if (name === 'useCustomOrigin' && !checked) {
        const person = formData.personId ? getPerson(formData.personId) : null;
        const defaultOrigin = person?.homeAddress || DEFAULT_ORIGIN;
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

  const handleOpenGoogleMaps = () => {
    try {
      calculateDistance(formData.origin, formData.destination);
    } catch (error) {
      // The error contains the instructions for the user
      if (error instanceof Error) {
        alert(error.message);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const tripData = {
      date: formData.date,
      personId: formData.personId,
      vehicleId: formData.vehicleId,
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
    };

    if (isEditing && trip) {
      updateTrip({
        id: trip.id,
        ...tripData,
      });
    } else {
      addTrip(tripData);
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
          {isEditing ? 'Modifica Tragitto' : 'Nuovo Tragitto'}
        </h1>
      </div>

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
              options={state.people.map(p => ({ 
                value: p.id, 
                label: `${p.name} ${p.surname} (${p.role})` 
              }))}
              value={formData.personId}
              onChange={handleChange}
              error={errors.personId}
              required
            />
          </div>

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

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <div className="flex items-center mb-2">
              <Home className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">Indirizzo di Partenza</span>
            </div>
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
            {formData.useCustomOrigin ? (
              <Input
                id="origin"
                name="origin"
                value={formData.origin}
                onChange={handleChange}
                error={errors.origin}
                placeholder="Inserisci l'indirizzo di partenza"
                required
              />
            ) : (
              <p className="text-sm text-blue-600">
                {formData.personId
                  ? getPerson(formData.personId)?.homeAddress || DEFAULT_ORIGIN
                  : DEFAULT_ORIGIN}
              </p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
            <div className="flex items-center mb-2">
              <MapPin className="h-5 w-5 text-blue-500 mr-2" />
              <span className="font-medium text-blue-800">Indirizzo di Destinazione</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center mb-4">
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

              {formData.useCustomDestination ? (
                <Input
                  id="destination"
                  name="destination"
                  value={formData.destination}
                  onChange={handleChange}
                  error={errors.destination}
                  placeholder="Inserisci l'indirizzo di destinazione"
                  required
                />
              ) : (
                <Select
                  id="savedRouteId"
                  name="savedRouteId"
                  label="Seleziona un percorso salvato"
                  options={state.savedRoutes.map(r => ({ 
                    value: r.id, 
                    label: `${r.name} (${r.destination})` 
                  }))}
                  value={formData.savedRouteId}
                  onChange={handleSavedRouteChange}
                  error={errors.destination}
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
                  Questo viaggio include pedaggi autostradali
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
                  <Input
                    id="tollEntryStation"
                    name="tollEntryStation"
                    label="Casello di Entrata"
                    value={formData.tollEntryStation}
                    onChange={handleChange}
                    placeholder="es. Treviso"
                  />
                  <Input
                    id="tollExitStation"
                    name="tollExitStation"
                    label="Casello di Uscita"
                    value={formData.tollExitStation}
                    onChange={handleChange}
                    placeholder="es. Vicenza"
                  />
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
                </div>
              </div>
            )}
          </div>

          {reimbursement !== null && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Calculator className="h-5 w-5 text-primary-500 mr-3 mt-1" />
                <div className="flex-grow">
                  <h3 className="text-sm font-medium text-primary-800 mb-2">Riepilogo Rimborso</h3>

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

                    <div className="border-t-2 border-primary-300 pt-2 mt-2 flex justify-between items-center">
                      <span className="text-sm font-medium text-primary-800">Totale Generale:</span>
                      <span className="text-xl font-bold text-primary-900">
                        {(reimbursement + (tollAmount || 0)).toFixed(2)} €
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-1">
              Scopo del viaggio
            </label>
            <textarea
              id="purpose"
              name="purpose"
              rows={3}
              className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Descrivi lo scopo del viaggio"
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
              {isEditing ? 'Salva Modifiche' : 'Registra Tragitto'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default TripForm;