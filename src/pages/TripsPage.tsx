import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, PlusCircle, User, Route, ChevronRight } from 'lucide-react';
import Button from '../components/Button';
import { useAppContext } from '../context/AppContext';
import { Person } from '../types';

const PersonCard: React.FC<{ person: Person }> = ({ person }) => {
  const { state } = useAppContext();
  const navigate = useNavigate();

  const personTrips = state.trips.filter(t => t.personId === person.id);
  const totalKm = personTrips.reduce((sum, t) => sum + (t.isRoundTrip ? t.distance * 2 : t.distance), 0);

  return (
    <button
      onClick={() => navigate(`/tragitti/persona/${person.id}`)}
      className="w-full text-left bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-teal-200 transition-all group"
    >
      <div className="flex-shrink-0 w-11 h-11 rounded-full bg-teal-50 border border-teal-100 flex items-center justify-center">
        <User size={18} className="text-teal-600" />
      </div>
      <div className="flex-1 min-w-0">
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
              {totalKm.toFixed(0)} km
            </span>
          )}
        </div>
      </div>
      <ChevronRight size={16} className="text-gray-300 group-hover:text-teal-500 transition-colors flex-shrink-0" />
    </button>
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
            <PersonCard key={person.id} person={person} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TripsPage;
