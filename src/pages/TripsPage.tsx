import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Edit, Trash2, PlusCircle, Banknote, Copy,
  ChevronDown, ChevronUp, User, Route, Calendar
} from 'lucide-react';
import Button from '../components/Button';
import Select from '../components/Select';
import { useAppContext } from '../context/AppContext';
import { Person, Trip } from '../types';

const PersonTripCard: React.FC<{ person: Person }> = ({ person }) => {
  const { state, deleteTrip, getVehicle, formatDate } = useAppContext();
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [monthFilter, setMonthFilter] = useState('');

  const personTrips = state.trips.filter(t => t.personId === person.id);

  const monthOptions = () => {
    const options: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = `${d.toLocaleString('it-IT', { month: 'long' })} ${d.getFullYear()}`;
      options.push({ value, label });
    }
    return options;
  };

  const filteredTrips = personTrips.filter(t => {
    if (!monthFilter) return true;
    const [y, m] = monthFilter.split('-').map(Number);
    const d = new Date(t.date);
    return d.getFullYear() === y && d.getMonth() === m - 1;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalKm = personTrips.reduce((sum, t) => sum + (t.isRoundTrip ? t.distance * 2 : t.distance), 0);

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa trasferta?')) {
      deleteTrip(id);
    }
  };

  const handleDuplicate = (trip: Trip) => {
    navigate('/tragitti/nuovo', { state: { duplicateTrip: trip } });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between group"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
            <User size={18} className="text-teal-600" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 truncate">
              {person.surname} {person.name}
            </p>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Route size={11} />
                {personTrips.length} {personTrips.length === 1 ? 'trasferta' : 'trasferte'}
              </span>
              {totalKm > 0 && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin size={11} />
                  {totalKm.toFixed(0)} km totali
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          <span
            onClick={(e) => {
              e.stopPropagation();
              navigate('/tragitti/nuovo', { state: { preselectedPersonId: person.id } });
            }}
            className="hidden sm:flex items-center gap-1 text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-md px-2 py-1 transition-colors"
          >
            <PlusCircle size={13} />
            Aggiungi
          </span>
          {expanded
            ? <ChevronUp size={18} className="text-gray-400" />
            : <ChevronDown size={18} className="text-gray-400" />
          }
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-5">
          <div className="pt-4 pb-3 flex items-center gap-3">
            <Select
              id={`month-filter-${person.id}`}
              label=""
              options={monthOptions()}
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="primary"
              size="sm"
              icon={<PlusCircle size={14} />}
              onClick={() => navigate('/tragitti/nuovo', { state: { preselectedPersonId: person.id } })}
              className="flex-shrink-0 sm:hidden"
            >
              Aggiungi
            </Button>
          </div>

          {filteredTrips.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">
              {monthFilter ? 'Nessuna trasferta nel mese selezionato.' : 'Nessuna trasferta registrata.'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredTrips.map(trip => {
                const vehicle = getVehicle(trip.vehicleId);
                const km = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
                const toll = trip.hasToll && trip.tollAmount
                  ? (trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount)
                  : null;

                return (
                  <div
                    key={trip.id}
                    className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
                          <Calendar size={11} />
                          {formatDate(trip.date)}
                        </span>
                        {vehicle && (
                          <span className="text-xs text-gray-400 whitespace-nowrap">
                            {vehicle.make} {vehicle.model}
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-medium text-gray-800 mt-1 truncate">
                        {trip.origin} &rarr; {trip.destination}
                        {trip.isRoundTrip && <span className="ml-1 text-teal-600 text-xs">(A/R)</span>}
                      </p>
                      {trip.purpose && (
                        <p className="text-xs text-gray-500 truncate mt-0.5">{trip.purpose}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 flex-shrink-0 text-sm">
                      <span className="font-medium text-gray-700 whitespace-nowrap">{km.toFixed(1)} km</span>
                      {toll !== null && (
                        <span className="flex items-center gap-1 text-amber-700 whitespace-nowrap">
                          <Banknote size={13} />
                          {toll.toFixed(2)} €
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        title="Modifica"
                        onClick={() => navigate(`/tragitti/${trip.id}`)}
                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Edit size={15} />
                      </button>
                      <button
                        title="Duplica"
                        onClick={() => handleDuplicate(trip)}
                        className="p-1.5 rounded-md text-gray-500 hover:bg-gray-200 transition-colors"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        title="Elimina"
                        onClick={() => handleDelete(trip.id)}
                        className="p-1.5 rounded-md text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TripsPage: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();

  const sortedPeople = [...state.people].sort((a, b) =>
    a.surname.localeCompare(b.surname) || a.name.localeCompare(b.name)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Trasferte</h1>
        <Button
          variant="primary"
          icon={<PlusCircle size={18} />}
          onClick={() => navigate('/tragitti/nuovo')}
        >
          Nuova Trasferta
        </Button>
      </div>

      {sortedPeople.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <User size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nessuna persona registrata. Aggiungi persone dalla sezione Persone.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedPeople.map(person => (
            <PersonTripCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TripsPage;
