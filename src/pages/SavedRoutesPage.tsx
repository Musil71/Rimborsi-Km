import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Edit, Trash2, Search, PlusCircle, Route } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import { useAppContext } from '../context/AppContext';
import { SavedRoute } from '../types';

const SavedRoutesPage: React.FC = () => {
  const { state, deleteSavedRoute } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo percorso salvato?')) {
      deleteSavedRoute(id);
    }
  };

  const filteredRoutes = state.savedRoutes.filter(
    (route) =>
      route.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
      route.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      key: 'name',
      header: 'Nome Percorso',
      render: (route: SavedRoute) => (
        <span className="font-medium text-gray-900">{route.name}</span>
      ),
    },
    {
      key: 'origin',
      header: 'Origine',
      render: (route: SavedRoute) => (
        <span className="text-sm text-gray-600">
          {route.origin.length > 30 ? route.origin.substring(0, 30) + '...' : route.origin}
        </span>
      ),
    },
    {
      key: 'destination',
      header: 'Destinazione',
      render: (route: SavedRoute) => (
        <span className="text-sm text-gray-600">
          {route.destination.length > 30 ? route.destination.substring(0, 30) + '...' : route.destination}
        </span>
      ),
    },
    {
      key: 'distances',
      header: 'Opzioni Percorso',
      render: (route: SavedRoute) => (
        <div className="space-y-1">
          {route.distances.map((distance, index) => (
            <div key={distance.id} className="flex items-center space-x-2">
              <Route className="h-3 w-3 text-teal-500" />
              <span className="text-xs text-gray-600">
                {distance.label}: <span className="font-medium">{distance.distance.toFixed(1)} km</span>
              </span>
            </div>
          ))}
          {route.distances.length === 0 && (
            <span className="text-xs text-red-500">Nessuna distanza configurata</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Azioni',
      className: 'text-right w-32',
      render: (route: SavedRoute) => (
        <div className="flex flex-col items-end space-y-2">
          <Button
            variant="info"
            size="sm"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/percorsi/${route.id}`);
            }}
          >
            Modifica
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(route.id);
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
        <h1 className="text-2xl font-bold text-gray-800">Percorsi Salvati</h1>
        <Link to="/percorsi/nuovo">
          <Button variant="primary" icon={<PlusCircle size={18} />}>
            Nuovo Percorso
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
            placeholder="Cerca per nome, origine o destinazione..."
            className="pl-10 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="mb-4 bg-blue-50 rounded-md p-4 border border-blue-200">
          <div className="flex items-start">
            <MapPin className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-blue-800">Percorsi con Multiple Opzioni</h3>
              <p className="text-sm text-blue-600 mt-1">
                Ora puoi salvare più opzioni di distanza per ogni percorso (es. strada normale, autostrada).
                Questo ti permetterà di selezionare rapidamente l'opzione desiderata quando inserisci un nuovo tragitto,
                riducendo la necessità di consultare Google Maps ogni volta.
              </p>
            </div>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredRoutes}
          keyExtractor={(route) => route.id}
          onRowClick={(route) => navigate(`/percorsi/${route.id}`)}
          emptyMessage={
            searchTerm
              ? "Nessun percorso trovato con questi criteri di ricerca"
              : "Nessun percorso salvato. Clicca su 'Nuovo Percorso' per iniziare."
          }
        />
      </Card>
    </div>
  );
};

export default SavedRoutesPage;