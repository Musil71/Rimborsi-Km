import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MapPin, Edit, Trash2, PlusCircle, Banknote, Copy,
  User, Calendar, ArrowLeft, Route
} from 'lucide-react';
import Button from '../components/Button';
import Select from '../components/Select';
import { useAppContext } from '../context/AppContext';
import { Trip } from '../types';

const PersonTripsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { state, deleteTrip, getVehicle, formatDate } = useAppContext();
  const navigate = useNavigate();

  const [monthFilter, setMonthFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const person = state.people.find(p => p.id === id);
  const personTrips = state.trips.filter(t => t.personId === id);

  const monthOptions = () => {
    const options: { value: string; label: string }[] = [{ value: '', label: 'Tutti i mesi' }];
    const months = new Set<string>();
    personTrips.forEach(t => {
      const d = new Date(t.date);
      const value = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      months.add(value);
    });
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      if (months.has(value)) {
        const label = `${d.toLocaleString('it-IT', { month: 'long' })} ${d.getFullYear()}`;
        options.push({ value, label });
      }
    }
    return options;
  };

  const roleOptions = [
    { value: '', label: 'Tutti i ruoli' },
    { value: 'docente', label: 'Docente' },
    { value: 'dipendente', label: 'Dipendente' },
    { value: 'amministratore', label: 'Amministratore' },
  ];

  const filteredTrips = personTrips.filter(t => {
    if (monthFilter) {
      const [y, m] = monthFilter.split('-').map(Number);
      const d = new Date(t.date);
      if (!(d.getFullYear() === y && d.getMonth() === m - 1)) return false;
    }
    if (roleFilter && t.tripRole !== roleFilter) return false;
    return true;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalKm = filteredTrips.reduce((sum, t) => sum + (t.isRoundTrip ? t.distance * 2 : t.distance), 0);
  const totalToll = filteredTrips.reduce((sum, t) => {
    if (!t.hasToll) return sum;
    const outbound = t.tollAmount ?? 0;
    const returnToll = t.isRoundTrip ? (t.returnTollAmount ?? t.tollAmount ?? 0) : 0;
    return sum + outbound + returnToll;
  }, 0);

  const handleDelete = (tripId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa trasferta?')) {
      deleteTrip(tripId);
    }
  };

  const handleDuplicate = (trip: Trip) => {
    navigate('/tragitti/nuovo', { state: { duplicateTrip: trip } });
  };

  if (!person) {
    return (
      <div className="text-center py-20 text-gray-400">
        <User size={40} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">Persona non trovata.</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/tragitti')}>
          Torna alle trasferte
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tragitti')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={16} />
          Trasferte
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0">
            <User size={22} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {person.surname} {person.name}
            </h1>
            <div className="flex items-center gap-4 mt-0.5">
              <span className="text-sm text-gray-500 flex items-center gap-1.5">
                <Route size={13} />
                {personTrips.length} {personTrips.length === 1 ? 'trasferta' : 'trasferte'} totali
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="primary"
          icon={<PlusCircle size={16} />}
          onClick={() => navigate('/tragitti/nuovo', { state: { preselectedPersonId: person.id } })}
        >
          Nuova Trasferta
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-full sm:w-56">
          <Select
            id="month-filter"
            label=""
            options={monthOptions()}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            id="role-filter"
            label=""
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          />
        </div>
        {filteredTrips.length > 0 && (
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-teal-600" />
              <span className="font-medium text-gray-800">{totalKm.toFixed(0)} km</span>
            </span>
            {totalToll > 0 && (
              <span className="flex items-center gap-1.5">
                <Banknote size={14} className="text-amber-600" />
                <span className="font-medium text-gray-800">{totalToll.toFixed(2)} €</span> pedaggi
              </span>
            )}
          </div>
        )}
      </div>

      {filteredTrips.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Route size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {(monthFilter || roleFilter) ? 'Nessuna trasferta corrisponde ai filtri selezionati.' : 'Nessuna trasferta registrata.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTrips.map(trip => {
            const vehicle = getVehicle(trip.vehicleId);
            const km = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
            const outboundToll = trip.hasToll && trip.tollAmount ? trip.tollAmount : null;
            const returnToll = trip.hasToll && trip.isRoundTrip
              ? (trip.returnTollAmount ?? trip.tollAmount ?? null)
              : null;
            const totalTripToll = (outboundToll ?? 0) + (returnToll ?? 0);

            return (
              <div
                key={trip.id}
                className="rounded-xl border border-gray-200 bg-white px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-gray-300 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar size={12} />
                      {formatDate(trip.date)}
                    </span>
                    {vehicle && (
                      <span className="text-xs text-gray-400">
                        {vehicle.make} {vehicle.model}
                      </span>
                    )}
                    {trip.isRoundTrip && (
                      <span className="text-xs font-medium text-teal-600 bg-teal-50 border border-teal-100 rounded px-1.5 py-0.5">
                        A/R
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-1.5">
                    {trip.origin} &rarr; {trip.destination}
                  </p>
                  {trip.purpose && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{trip.purpose}</p>
                  )}
                </div>

                <div className="flex items-center gap-5 flex-shrink-0 text-sm">
                  <span className="flex items-center gap-1 text-gray-700 font-medium">
                    <MapPin size={13} className="text-teal-500" />
                    {km.toFixed(1)} km
                  </span>
                  {totalTripToll > 0 && (
                    <span className="flex items-center gap-1 text-amber-700">
                      <Banknote size={13} />
                      {totalTripToll.toFixed(2)} €
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    title="Modifica"
                    onClick={() => navigate(`/tragitti/${trip.id}`)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 border border-blue-100 hover:bg-blue-50 transition-colors"
                  >
                    <Edit size={13} />
                    Modifica
                  </button>
                  <button
                    title="Duplica"
                    onClick={() => handleDuplicate(trip)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-100 transition-colors"
                  >
                    <Copy size={13} />
                    Duplica
                  </button>
                  <button
                    title="Elimina"
                    onClick={() => handleDelete(trip.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-500 border border-red-100 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={13} />
                    Elimina
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PersonTripsPage;
