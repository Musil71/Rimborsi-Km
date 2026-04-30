import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Trip, Role, TripMeal } from '../types';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import Button from './Button';

interface QuickEditTripModalProps {
  trip: Trip | null;
  onClose: () => void;
  onSaved: () => void;
}

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'docente', label: 'Docente' },
  { value: 'amministratore', label: 'Amministratore' },
  { value: 'dipendente', label: 'Dipendente' },
];

const QuickEditTripModal: React.FC<QuickEditTripModalProps> = ({ trip, onClose, onSaved }) => {
  const { state, updateTrip, getVehiclesForPerson, formatDate } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [date, setDate] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [distance, setDistance] = useState('');
  const [isRoundTrip, setIsRoundTrip] = useState(false);
  const [tripRole, setTripRole] = useState<Role | ''>('');
  const [vehicleId, setVehicleId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [hasToll, setHasToll] = useState(false);
  const [tollAmount, setTollAmount] = useState('');
  const [hasMeal, setHasMeal] = useState(false);
  const [meals, setMeals] = useState<Omit<TripMeal, 'id' | 'tripId'>[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!trip) return;
    setDate(trip.date);
    setOrigin(trip.origin);
    setDestination(trip.destination);
    setDistance(trip.distance.toString());
    setIsRoundTrip(trip.isRoundTrip);
    setTripRole(trip.tripRole || '');
    setVehicleId(trip.vehicleId);
    setPurpose(trip.purpose || '');
    setHasToll(trip.hasToll || false);
    setTollAmount(trip.tollAmount ? trip.tollAmount.toString() : '');
    const existingMeals = trip.meals && trip.meals.length > 0
      ? trip.meals.map(m => ({ mealType: m.mealType, amount: m.amount }))
      : trip.hasMeal && trip.mealType && trip.mealAmount
        ? [{ mealType: trip.mealType, amount: trip.mealAmount }]
        : [];
    setMeals(existingMeals);
    setHasMeal(existingMeals.length > 0);
  }, [trip]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!trip) return null;

  const vehiclesForPerson = getVehiclesForPerson(trip.personId);

  const handleMealToggle = (checked: boolean) => {
    setHasMeal(checked);
    if (!checked) {
      setMeals([]);
    } else if (meals.length === 0) {
      setMeals([{ mealType: 'pranzo', amount: 0 }]);
    }
  };

  const handleAddMeal = () => {
    setMeals(prev => [...prev, { mealType: 'cena', amount: 0 }]);
  };

  const handleRemoveMeal = (idx: number) => {
    setMeals(prev => {
      const updated = prev.filter((_, i) => i !== idx);
      if (updated.length === 0) setHasMeal(false);
      return updated;
    });
  };

  const handleMealChange = (idx: number, field: 'mealType' | 'amount', value: string) => {
    setMeals(prev => prev.map((m, i) =>
      i === idx
        ? { ...m, [field]: field === 'amount' ? parseFloat(value) || 0 : value }
        : m
    ));
  };

  const handleSave = async () => {
    if (!distance || isNaN(parseFloat(distance)) || parseFloat(distance) <= 0) {
      showToast('Inserisci un valore valido per i km', 'error');
      return;
    }
    setSaving(true);
    try {
      const updatedTrip: Trip = {
        ...trip,
        date,
        origin: origin.trim(),
        destination: destination.trim(),
        distance: parseFloat(distance),
        isRoundTrip,
        tripRole: tripRole as Role || undefined,
        vehicleId,
        purpose: purpose.trim(),
        hasToll,
        tollAmount: hasToll && tollAmount ? parseFloat(tollAmount) : undefined,
        tollEntryStation: hasToll ? trip.tollEntryStation : undefined,
        tollExitStation: hasToll ? trip.tollExitStation : undefined,
        returnTollEntryStation: hasToll && isRoundTrip ? trip.returnTollEntryStation : undefined,
        returnTollExitStation: hasToll && isRoundTrip ? trip.returnTollExitStation : undefined,
        returnTollAmount: hasToll && isRoundTrip ? trip.returnTollAmount : undefined,
        hasMeal: hasMeal && meals.length > 0,
        mealType: undefined,
        mealAmount: undefined,
      };

      await updateTrip(updatedTrip, hasMeal && meals.length > 0 ? meals : []);
      showToast('Trasferta aggiornata', 'success');
      onSaved();
      onClose();
    } catch (err) {
      console.error(err);
      showToast('Errore durante il salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const distNum = parseFloat(distance) || 0;
  const effectiveKm = isRoundTrip ? distNum * 2 : distNum;
  const vehicle = state.vehicles.find(v => v.id === vehicleId);
  const kmReimbursement = vehicle ? effectiveKm * vehicle.reimbursementRate : null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="fixed inset-0 bg-gray-700 bg-opacity-60 transition-opacity" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Modifica rapida trasferta</h2>
              <p className="text-xs text-gray-500 mt-0.5">{formatDate(trip.date)} &mdash; {trip.origin} &rarr; {trip.destination}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { onClose(); navigate(`/tragitti/${trip.id}`); }}
                className="inline-flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors px-2 py-1 rounded hover:bg-teal-50"
                title="Apri scheda completa"
              >
                <ExternalLink size={13} />
                Scheda completa
              </button>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors rounded p-1 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Ruolo trasferta</label>
                <select
                  value={tripRole}
                  onChange={e => setTripRole(e.target.value as Role | '')}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                >
                  <option value="">-- nessun ruolo --</option>
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Origine</label>
                <input
                  type="text"
                  value={origin}
                  onChange={e => setOrigin(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Destinazione</label>
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Km (solo andata)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={distance}
                    onChange={e => setDistance(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isRoundTrip}
                      onChange={e => setIsRoundTrip(e.target.checked)}
                      className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                    />
                    <span className="text-xs font-medium text-gray-700">A/R</span>
                  </label>
                </div>
                {distNum > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Totale: <span className="font-medium">{effectiveKm.toFixed(1)} km</span>
                    {kmReimbursement !== null && (
                      <span className="ml-2 text-teal-700 font-medium">{kmReimbursement.toFixed(2)} €</span>
                    )}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Veicolo</label>
                <select
                  value={vehicleId}
                  onChange={e => setVehicleId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                >
                  {vehiclesForPerson.map(v => (
                    <option key={v.id} value={v.id}>{v.make} {v.model} ({v.plate}) &mdash; {v.reimbursementRate.toFixed(4)} €/km</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Motivo</label>
              <input
                type="text"
                value={purpose}
                onChange={e => setPurpose(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
              />
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasToll}
                  onChange={e => setHasToll(e.target.checked)}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Pedaggio autostradale</span>
              </label>
              {hasToll && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Importo pedaggio {isRoundTrip ? '(solo andata; il ritorno rimane invariato)' : ''}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tollAmount}
                    onChange={e => setTollAmount(e.target.value)}
                    className="w-32 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                    placeholder="0.00"
                  />
                  <span className="ml-2 text-sm text-gray-500">€</span>
                  {isRoundTrip && trip.returnTollAmount && (
                    <p className="text-xs text-gray-500 mt-1">Ritorno: {trip.returnTollAmount.toFixed(2)} € (invariato, modifica dalla scheda completa)</p>
                  )}
                </div>
              )}
            </div>

            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasMeal}
                  onChange={e => handleMealToggle(e.target.checked)}
                  className="h-4 w-4 text-teal-600 border-gray-300 rounded"
                />
                <span className="text-sm font-medium text-gray-700">Rimborso pasto</span>
              </label>
              {hasMeal && (
                <div className="space-y-2">
                  {meals.map((meal, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <select
                        value={meal.mealType}
                        onChange={e => handleMealChange(idx, 'mealType', e.target.value)}
                        className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white"
                      >
                        <option value="pranzo">Pranzo</option>
                        <option value="cena">Cena</option>
                      </select>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={meal.amount || ''}
                        onChange={e => handleMealChange(idx, 'amount', e.target.value)}
                        className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none"
                        placeholder="0.00"
                      />
                      <span className="text-sm text-gray-500">€</span>
                      <button
                        onClick={() => handleRemoveMeal(idx)}
                        className="text-red-400 hover:text-red-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleAddMeal}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium transition-colors"
                  >
                    + Aggiungi pasto
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Annulla
            </Button>
            <Button variant="primary" icon={<Save size={16} />} onClick={handleSave} disabled={saving}>
              {saving ? 'Salvataggio...' : 'Salva modifiche'}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QuickEditTripModal;
