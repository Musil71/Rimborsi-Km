import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Edit, Trash2, Search } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import { useAppContext } from '../context/AppContext';
import { Person } from '../types';

const PeoplePage: React.FC = () => {
  const { state, deletePerson } = useAppContext();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questa persona? Verranno eliminati anche tutti i veicoli e i tragitti associati.')) {
      deletePerson(id);
    }
  };

  const filteredPeople = state.people.filter(
    (person) =>
      person.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      person.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (searchTerm.toLowerCase().includes('docent') && person.isDocente) ||
      (searchTerm.toLowerCase().includes('amministrat') && person.isAmministratore) ||
      (searchTerm.toLowerCase().includes('dipendent') && person.isDipendente)
  );

  const columns = [
    {
      key: 'name',
      header: 'Nome',
      render: (person: Person) => (
        <span className="font-medium text-gray-900">{person.name} {person.surname}</span>
      ),
    },
    {
      key: 'roles',
      header: 'Ruoli',
      render: (person: Person) => (
        <div className="flex flex-wrap gap-1">
          {person.isDocente && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
              Docente
            </span>
          )}
          {person.isAmministratore && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Amministratore
            </span>
          )}
          {person.isDipendente && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Dipendente
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
    },
    {
      key: 'vehicles',
      header: 'Veicoli',
      render: (person: Person) => {
        const vehicleCount = state.vehicles.filter(v => v.personId === person.id).length;
        return <span>{vehicleCount}</span>;
      },
    },
    {
      key: 'actions',
      header: 'Azioni',
      className: 'text-right w-32',
      render: (person: Person) => (
        <div className="flex flex-col items-end space-y-2">
          <Button
            variant="info"
            size="sm"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/persone/${person.id}`);
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
              handleDelete(person.id);
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
        <h1 className="text-2xl font-bold text-gray-800">Gestione Persone</h1>
        <Link to="/persone/nuovo">
          <Button variant="primary" icon={<UserPlus size={18} />}>
            Aggiungi Persona
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
            placeholder="Cerca per nome, cognome o ruolo..."
            className="pl-10 shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          data={filteredPeople}
          keyExtractor={(person) => person.id}
          onRowClick={(person) => navigate(`/persone/${person.id}`)}
          emptyMessage={
            searchTerm
              ? "Nessuna persona trovata con questi criteri di ricerca"
              : "Nessuna persona aggiunta. Clicca su 'Aggiungi Persona' per iniziare."
          }
        />
      </Card>
    </div>
  );
};

export default PeoplePage;