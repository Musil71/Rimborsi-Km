import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CarFront, Edit, Trash2, Search } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import { useAppContext } from '../context/AppContext';
import { Vehicle } from '../types';

const VehiclesPage: React.FC = () => {
  const { state, deleteVehicle, getPerson } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo veicolo? Verranno eliminati anche tutti i tragitti associati.')) {
      deleteVehicle(id);
    }
  };

  const filteredVehicles = state.vehicles.filter((vehicle) => {
    const person = getPerson(vehicle.personId);
    const searchTermLower = searchTerm.toLowerCase();
    
    return (
      vehicle.make.toLowerCase().includes(searchTermLower) ||
      vehicle.model.toLowerCase().includes(searchTermLower) ||
      vehicle.plate.toLowerCase().includes(searchTermLower) ||
      (person && `${person.name} ${person.surname}`.toLowerCase().includes(searchTermLower))
    );
  });

  const columns = [
    {
      key: 'owner',
      header: 'Proprietario',
      render: (vehicle: Vehicle) => {
        const person = getPerson(vehicle.personId);
        return person ? (
          <span className="font-medium text-gray-900">
            {person.name} {person.surname}
          </span>
        ) : (
          <span className="text-red-500">Proprietario non trovato</span>
        );
      },
    },
    {
      key: 'vehicle',
      header: 'Veicolo',
      render: (vehicle: Vehicle) => (
        <span>
          {vehicle.make} {vehicle.model}
        </span>
      ),
    },
    {
      key: 'plate',
      header: 'Targa',
      render: (vehicle: Vehicle) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {vehicle.plate}
        </span>
      ),
    },
    {
      key: 'reimbursementRate',
      header: 'Tariffa (€/km)',
      render: (vehicle: Vehicle) => (
        <span className="font-medium">{vehicle.reimbursementRate.toFixed(2)} €</span>
      ),
    },
    {
      key: 'actions',
      header: 'Azioni',
      className: 'text-right w-32',
      render: (vehicle: Vehicle) => (
        <div className="flex flex-col items-end space-y-2">
          <Button
            variant="info"
            size="sm"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/veicoli/${vehicle.id}`);
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
              handleDelete(vehicle.id);
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
        <h1 className="text-2xl font-bold text-gray-800">Gestione Veicoli</h1>
        <Link to="/veicoli/nuovo">
          <Button variant="primary" icon={<CarFront size={18} />}>
            Aggiungi Veicolo
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
            placeholder="Cerca per marca, modello, targa o proprietario..."
            className="pl-10 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          data={filteredVehicles}
          keyExtractor={(vehicle) => vehicle.id}
          onRowClick={(vehicle) => navigate(`/veicoli/${vehicle.id}`)}
          emptyMessage={
            searchTerm
              ? "Nessun veicolo trovato con questi criteri di ricerca"
              : "Nessun veicolo aggiunto. Clicca su 'Aggiungi Veicolo' per iniziare."
          }
        />
      </Card>
    </div>
  );
};

export default VehiclesPage;