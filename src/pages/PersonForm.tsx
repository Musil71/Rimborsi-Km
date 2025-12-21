import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Plus, Edit, Trash2, Car } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Person, Role, Vehicle } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface PersonFormData {
  name: string;
  surname: string;
  role: Role;
  email: string;
  phone: string;
  homeAddress: string;
}

interface VehicleFormData {
  make: string;
  model: string;
  plate: string;
  reimbursementRate: string;
}

interface PersonFormErrors {
  name?: string;
  surname?: string;
  role?: string;
}

interface VehicleFormErrors {
  make?: string;
  model?: string;
  plate?: string;
  reimbursementRate?: string;
}

const roleOptions = [
  { value: 'docente', label: 'Docente' },
  { value: 'dipendente', label: 'Dipendente' },
  { value: 'amministratore', label: 'Amministratore' },
];

const PersonForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addPerson, updatePerson, addVehicle, updateVehicle, deleteVehicle, getVehiclesForPerson } = useAppContext();
  const { showToast } = useToast();

  const isEditing = !!id;
  const person = isEditing ? state.people.find((p) => p.id === id) : null;
  const personVehicles = isEditing ? getVehiclesForPerson(id!) : [];

  const [personFormData, setPersonFormData] = useState<PersonFormData>({
    name: '',
    surname: '',
    role: 'docente',
    email: '',
    phone: '',
    homeAddress: '',
  });

  const [vehicleFormData, setVehicleFormData] = useState<VehicleFormData>({
    make: '',
    model: '',
    plate: '',
    reimbursementRate: '0.35',
  });

  const [personErrors, setPersonErrors] = useState<PersonFormErrors>({});
  const [vehicleErrors, setVehicleErrors] = useState<VehicleFormErrors>({});
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);

  useEffect(() => {
    if (person) {
      setPersonFormData({
        name: person.name,
        surname: person.surname,
        role: person.role,
        email: person.email || '',
        phone: person.phone || '',
        homeAddress: person.homeAddress || '',
      });
    }
  }, [person]);

  const validatePersonForm = (): boolean => {
    const newErrors: PersonFormErrors = {};

    if (!personFormData.name.trim()) {
      newErrors.name = 'Il nome è obbligatorio';
    }

    if (!personFormData.surname.trim()) {
      newErrors.surname = 'Il cognome è obbligatorio';
    }

    if (!personFormData.role) {
      newErrors.role = 'Il ruolo è obbligatorio';
    }

    setPersonErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateVehicleForm = (): boolean => {
    const newErrors: VehicleFormErrors = {};

    if (!vehicleFormData.make.trim()) {
      newErrors.make = 'La marca è obbligatoria';
    }

    if (!vehicleFormData.model.trim()) {
      newErrors.model = 'Il modello è obbligatorio';
    }

    if (!vehicleFormData.plate.trim()) {
      newErrors.plate = 'La targa è obbligatoria';
    } else {
      // Check if plate already exists for other vehicles
      const existingVehicle = state.vehicles.find(v => 
        v.plate.toLowerCase() === vehicleFormData.plate.toLowerCase() && 
        v.id !== editingVehicleId
      );
      if (existingVehicle) {
        newErrors.plate = 'Questa targa è già registrata per un altro veicolo';
      }
    }

    const rate = parseFloat(vehicleFormData.reimbursementRate);
    if (isNaN(rate) || rate <= 0) {
      newErrors.reimbursementRate = 'La tariffa deve essere un numero positivo';
    }

    setVehicleErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePersonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPersonFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVehicleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePersonForm()) {
      return;
    }

    const personData = {
      name: personFormData.name,
      surname: personFormData.surname,
      role: personFormData.role as Role,
      email: personFormData.email || undefined,
      phone: personFormData.phone || undefined,
      homeAddress: personFormData.homeAddress || undefined,
    };

    try {
      if (isEditing && person) {
        await updatePerson({
          id: person.id,
          ...personData,
        });
        showToast('Persona aggiornata con successo', 'success');
      } else {
        await addPerson(personData);
        showToast('Persona aggiunta con successo', 'success');
        navigate('/persone');
      }
    } catch (error) {
      console.error('Errore durante il salvataggio della persona:', error);
      showToast('Errore durante il salvataggio della persona', 'error');
    }
  };

  const handleAddVehicle = () => {
    setIsAddingVehicle(true);
    setEditingVehicleId(null);
    setVehicleFormData({
      make: '',
      model: '',
      plate: '',
      reimbursementRate: '0.35',
    });
    setVehicleErrors({});
  };

  const handleEditVehicle = (vehicle: Vehicle) => {
    setIsAddingVehicle(true);
    setEditingVehicleId(vehicle.id);
    setVehicleFormData({
      make: vehicle.make,
      model: vehicle.model,
      plate: vehicle.plate,
      reimbursementRate: vehicle.reimbursementRate.toString(),
    });
    setVehicleErrors({});
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateVehicleForm()) {
      return;
    }

    if (!person && !isEditing) {
      showToast('Salva prima la persona per aggiungere un veicolo', 'error');
      return;
    }

    const vehicleData = {
      personId: person?.id || '',
      make: vehicleFormData.make,
      model: vehicleFormData.model,
      plate: vehicleFormData.plate,
      reimbursementRate: parseFloat(vehicleFormData.reimbursementRate),
    };

    try {
      if (editingVehicleId) {
        await updateVehicle({
          id: editingVehicleId,
          ...vehicleData,
        });
        showToast('Veicolo aggiornato con successo', 'success');
      } else {
        await addVehicle(vehicleData);
        showToast('Veicolo aggiunto con successo', 'success');
      }

      setIsAddingVehicle(false);
      setEditingVehicleId(null);
      setVehicleFormData({
        make: '',
        model: '',
        plate: '',
        reimbursementRate: '0.35',
      });
    } catch (error) {
      console.error('Errore durante il salvataggio del veicolo:', error);
      showToast('Errore durante il salvataggio del veicolo', 'error');
    }
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo veicolo? Verranno eliminati anche tutti i tragitti associati.')) {
      try {
        await deleteVehicle(vehicleId);
        showToast('Veicolo eliminato con successo', 'success');
      } catch (error) {
        console.error('Errore durante l\'eliminazione del veicolo:', error);
        showToast('Errore durante l\'eliminazione del veicolo', 'error');
      }
    }
  };

  const handleCancelVehicle = () => {
    setIsAddingVehicle(false);
    setEditingVehicleId(null);
    setVehicleFormData({
      make: '',
      model: '',
      plate: '',
      reimbursementRate: '0.35',
    });
    setVehicleErrors({});
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/persone')}
        >
          Torna all'elenco
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Modifica Persona' : 'Aggiungi Persona'}
        </h1>
      </div>

      {/* Person Form */}
      <Card title="Informazioni Personali">
        <form onSubmit={handlePersonSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="name"
              name="name"
              label="Nome"
              value={personFormData.name}
              onChange={handlePersonChange}
              error={personErrors.name}
              required
            />

            <Input
              id="surname"
              name="surname"
              label="Cognome"
              value={personFormData.surname}
              onChange={handlePersonChange}
              error={personErrors.surname}
              required
            />
          </div>

          <Select
            id="role"
            name="role"
            label="Ruolo"
            options={roleOptions}
            value={personFormData.role}
            onChange={handlePersonChange}
            error={personErrors.role}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              id="email"
              name="email"
              label="Email"
              type="email"
              value={personFormData.email}
              onChange={handlePersonChange}
            />

            <Input
              id="phone"
              name="phone"
              label="Telefono"
              value={personFormData.phone}
              onChange={handlePersonChange}
            />
          </div>

          <Input
            id="homeAddress"
            name="homeAddress"
            label="Indirizzo di Casa"
            value={personFormData.homeAddress}
            onChange={handlePersonChange}
            placeholder="Via, Città"
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={18} />}
            >
              {isEditing ? 'Salva Modifiche' : 'Aggiungi Persona'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Vehicle Management Section - Only show for existing persons */}
      {isEditing && person && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <Car className="h-5 w-5 text-teal-600" />
              <h2 className="text-lg font-medium text-gray-900">
                Veicoli di {person.name} {person.surname}
              </h2>
            </div>
            {!isAddingVehicle && (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={handleAddVehicle}
              >
                Aggiungi Veicolo
              </Button>
            )}
          </div>

          {/* Add/Edit Vehicle Form */}
          {isAddingVehicle && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-md font-medium text-blue-900 mb-4">
                {editingVehicleId ? 'Modifica Veicolo' : 'Nuovo Veicolo'}
              </h3>
              <form onSubmit={handleVehicleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="make"
                    name="make"
                    label="Marca"
                    value={vehicleFormData.make}
                    onChange={handleVehicleChange}
                    error={vehicleErrors.make}
                    required
                  />

                  <Input
                    id="model"
                    name="model"
                    label="Modello"
                    value={vehicleFormData.model}
                    onChange={handleVehicleChange}
                    error={vehicleErrors.model}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    id="plate"
                    name="plate"
                    label="Targa"
                    value={vehicleFormData.plate}
                    onChange={handleVehicleChange}
                    error={vehicleErrors.plate}
                    required
                  />

                  <Input
                    id="reimbursementRate"
                    name="reimbursementRate"
                    label="Tariffa (€/km)"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={vehicleFormData.reimbursementRate}
                    onChange={handleVehicleChange}
                    error={vehicleErrors.reimbursementRate}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancelVehicle}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<Save size={18} />}
                  >
                    {editingVehicleId ? 'Salva Modifiche' : 'Aggiungi Veicolo'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Vehicle List */}
          <div className="space-y-3">
            {personVehicles.length > 0 ? (
              personVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-grow">
                      <div className="flex items-center space-x-3">
                        <Car className="h-5 w-5 text-gray-400" />
                        <div>
                          <h3 className="text-md font-medium text-gray-900">
                            {vehicle.make} {vehicle.model}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {vehicle.plate}
                            </span>
                            <span className="font-medium text-teal-600">
                              {vehicle.reimbursementRate.toFixed(2)} €/km
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="info"
                        size="sm"
                        icon={<Edit size={14} />}
                        onClick={() => handleEditVehicle(vehicle)}
                        disabled={isAddingVehicle}
                      >
                        Modifica
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => handleDeleteVehicle(vehicle.id)}
                        disabled={isAddingVehicle}
                      >
                        Elimina
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun veicolo registrato</h3>
                <p className="text-gray-600 mb-4">
                  Aggiungi un veicolo per {person.name} {person.surname} per iniziare a tracciare i rimborsi chilometrici.
                </p>
                {!isAddingVehicle && (
                  <Button
                    variant="primary"
                    icon={<Plus size={18} />}
                    onClick={handleAddVehicle}
                  >
                    Aggiungi Primo Veicolo
                  </Button>
                )}
              </div>
            )}
          </div>

          {personVehicles.length > 0 && (
            <div className="mt-4 p-3 bg-teal-50 border border-teal-200 rounded-md">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <Car className="h-5 w-5 text-teal-500" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-teal-800">
                    Gestione Semplificata
                  </h3>
                  <p className="text-sm text-teal-700 mt-1">
                    Ora quando crei un nuovo tragitto, il veicolo di {person.name} verrà selezionato automaticamente.
                    Questo semplifica il processo e riduce gli errori di inserimento.
                  </p>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Info for new persons */}
      {!isEditing && (
        <Card>
          <div className="text-center py-6">
            <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Gestione Veicoli</h3>
            <p className="text-gray-600">
              Dopo aver salvato la persona, potrai aggiungere e gestire i suoi veicoli direttamente da questa pagina.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default PersonForm;