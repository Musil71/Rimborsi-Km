import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Edit, Trash2, Search, PlusCircle, Calendar, Banknote, Copy } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import Select from '../components/Select';
import { useAppContext } from '../context/AppContext';
import { Trip } from '../types';

const TripsPage: React.FC = () => {
  const { state, deleteTrip, getPerson, getVehicle, formatDate } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [personFilter, setPersonFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo tragitto?')) {
      deleteTrip(id);
    }
  };

  const handleDuplicate = (trip: Trip) => {
    navigate('/tragitti/nuovo', { state: { duplicateTrip: trip } });
  };

  const filteredTrips = state.trips.filter((trip) => {
    const person = getPerson(trip.personId);
    const vehicle = getVehicle(trip.vehicleId);
    const tripDate = new Date(trip.date);
    const searchTermLower = searchTerm.toLowerCase();
    
    // Search filter
    const matchesSearch = 
      (person && `${person.name} ${person.surname}`.toLowerCase().includes(searchTermLower)) ||
      (vehicle && `${vehicle.make} ${vehicle.model}`.toLowerCase().includes(searchTermLower)) ||
      trip.origin.toLowerCase().includes(searchTermLower) ||
      trip.destination.toLowerCase().includes(searchTermLower) ||
      trip.purpose.toLowerCase().includes(searchTermLower);
    
    // Person filter
    const matchesPerson = !personFilter || trip.personId === personFilter;
    
    // Month filter
    const monthYear = monthFilter.split('-');
    const matchesMonth = !monthFilter || 
      (tripDate.getMonth() === parseInt(monthYear[1]) - 1 && 
       tripDate.getFullYear() === parseInt(monthYear[0]));
    
    return matchesSearch && matchesPerson && matchesMonth;
  });

  // Sort trips by date, most recent first
  const sortedTrips = [...filteredTrips].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Generate month options for filter
  const monthOptions = () => {
    const options = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      const label = `${date.toLocaleString('it-IT', { month: 'long' })} ${date.getFullYear()}`;
      options.push({ value, label });
    }
    return options;
  };

  const columns = [
    {
      key: 'date',
      header: 'Data',
      className: 'w-32',
      render: (trip: Trip) => (
        <span className="whitespace-nowrap">{formatDate(trip.date)}</span>
      ),
    },
    {
      key: 'person',
      header: 'Persona',
      className: 'w-40',
      render: (trip: Trip) => {
        const person = getPerson(trip.personId);
        return person ? (
          <span className="font-medium text-gray-900 whitespace-nowrap">
            {person.name} {person.surname}
          </span>
        ) : (
          <span className="text-red-500 whitespace-nowrap">Persona non trovata</span>
        );
      },
    },
    {
      key: 'vehicle',
      header: 'Veicolo',
      className: 'w-48',
      render: (trip: Trip) => {
        const vehicle = getVehicle(trip.vehicleId);
        return vehicle ? (
          <span className="whitespace-nowrap">
            {vehicle.make} {vehicle.model} ({vehicle.plate})
          </span>
        ) : (
          <span className="text-red-500 whitespace-nowrap">Veicolo non trovato</span>
        );
      },
    },
    {
      key: 'route',
      header: 'Percorso',
      className: 'max-w-md',
      render: (trip: Trip) => (
        <span className="block break-words">
          {trip.origin} → {trip.destination}
          {trip.isRoundTrip && <span className="ml-1 text-teal-600">(A/R)</span>}
        </span>
      ),
    },
    {
      key: 'distance',
      header: 'Km',
      className: 'w-24',
      render: (trip: Trip) => {
        const distance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        return <span className="whitespace-nowrap">{distance.toFixed(1)} km</span>;
      },
    },
    {
      key: 'toll',
      header: 'Pedaggio',
      className: 'w-32',
      render: (trip: Trip) => {
        if (trip.hasToll && trip.tollAmount) {
          const toll = trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount;
          return (
            <div className="flex items-center space-x-1 whitespace-nowrap">
              <Banknote size={14} className="text-amber-600" />
              <span className="text-amber-700 font-medium">{toll.toFixed(2)} €</span>
            </div>
          );
        }
        return <span className="text-gray-400 text-sm whitespace-nowrap">-</span>;
      },
    },
    {
      key: 'actions',
      header: 'Azioni',
      className: 'text-right w-32',
      render: (trip: Trip) => (
        <div className="flex flex-col items-end space-y-2">
          <Button
            variant="info"
            size="sm"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tragitti/${trip.id}`);
            }}
          >
            Modifica
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<Copy size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicate(trip);
            }}
          >
            Duplica
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(trip.id);
            }}
          >
            Elimina
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Tragitti</h1>
        <Link to="/tragitti/nuovo">
          <Button variant="primary" icon={<PlusCircle size={18} />}>
            Nuovo Tragitto
          </Button>
        </Link>
      </div>

      <Card>
        <div className="mb-4 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cerca tragitti..."
            className="pl-10 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="personFilter"
            label="Filtra per persona"
            options={state.people.map(p => ({ value: p.id, label: `${p.name} ${p.surname}` }))}
            value={personFilter}
            onChange={(e) => setPersonFilter(e.target.value)}
          />

          <Select
            id="monthFilter"
            label="Filtra per mese"
            options={monthOptions()}
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          data={sortedTrips}
          keyExtractor={(trip) => trip.id}
          onRowClick={(trip) => navigate(`/tragitti/${trip.id}`)}
          emptyMessage={
            searchTerm || personFilter || monthFilter
              ? "Nessun tragitto trovato con questi filtri"
              : "Nessun tragitto registrato. Clicca su 'Nuovo Tragitto' per iniziare."
          }
        />
      </Card>
    </div>
  );
};

export default TripsPage;