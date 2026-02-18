import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, ExternalLink, MapPin, Info, Plus, Trash2, Edit3 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { useAppContext } from '../context/AppContext';
import { calculateDistance } from '../utils/distanceCalculator';
import { SavedRoute, RouteDistance } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { ITFV_OFFICES } from '../utils/itfvOffices';

interface FormData {
  name: string;
  origin: string;
  destination: string;
  distances: RouteDistance[];
}

interface FormErrors {
  name?: string;
  origin?: string;
  destination?: string;
  distances?: string;
}

const SavedRouteForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addSavedRoute, updateSavedRoute } = useAppContext();

  const isEditing = !!id;
  const route = isEditing ? state.savedRoutes.find((r) => r.id === id) : null;

  const [formData, setFormData] = useState<FormData>({
    name: '',
    origin: '',
    destination: '',
    distances: [
      {
        id: uuidv4(),
        label: 'Percorso Standard',
        distance: 0
      }
    ]
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (route) {
      setFormData({
        name: route.name,
        origin: route.origin,
        destination: route.destination,
        distances: route.distances.length > 0 ? route.distances : [
          {
            id: uuidv4(),
            label: 'Percorso Standard',
            distance: 0
          }
        ]
      });
    }
  }, [route]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Il nome del percorso è obbligatorio';
    }

    if (!formData.origin.trim()) {
      newErrors.origin = "L'indirizzo di origine è obbligatorio";
    }

    if (!formData.destination.trim()) {
      newErrors.destination = "L'indirizzo di destinazione è obbligatorio";
    }

    // Validate distances
    if (formData.distances.length === 0) {
      newErrors.distances = 'Almeno una distanza è obbligatoria';
    } else {
      const hasInvalidDistance = formData.distances.some(d => 
        !d.label.trim() || isNaN(d.distance) || d.distance <= 0
      );
      if (hasInvalidDistance) {
        newErrors.distances = 'Tutte le distanze devono avere un nome e un valore positivo';
      }

      // Check for duplicate labels
      const labels = formData.distances.map(d => d.label.trim().toLowerCase());
      const uniqueLabels = new Set(labels);
      if (labels.length !== uniqueLabels.size) {
        newErrors.distances = 'I nomi delle distanze devono essere univoci';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDistanceChange = (distanceId: string, field: 'label' | 'distance' | 'tollEntryStation' | 'tollExitStation' | 'tollAmount', value: string) => {
    setFormData(prev => ({
      ...prev,
      distances: prev.distances.map(d =>
        d.id === distanceId
          ? {
              ...d,
              [field]: (field === 'distance' || field === 'tollAmount')
                ? parseFloat(value) || 0
                : value
            }
          : d
      )
    }));
  };

  const handleTollCheckboxChange = (distanceId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      distances: prev.distances.map(d =>
        d.id === distanceId
          ? {
              ...d,
              tollEntryStation: checked ? (d.tollEntryStation || '') : undefined,
              tollExitStation: checked ? (d.tollExitStation || '') : undefined,
              tollAmount: checked ? (d.tollAmount || 0) : undefined
            }
          : d
      )
    }));
  };

  const addDistance = () => {
    const newDistance: RouteDistance = {
      id: uuidv4(),
      label: '',
      distance: 0
    };
    setFormData(prev => ({
      ...prev,
      distances: [...prev.distances, newDistance]
    }));
  };

  const removeDistance = (distanceId: string) => {
    if (formData.distances.length <= 1) {
      return; // Don't allow removing the last distance
    }
    setFormData(prev => ({
      ...prev,
      distances: prev.distances.filter(d => d.id !== distanceId)
    }));
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

    const routeData = {
      name: formData.name,
      origin: formData.origin,
      destination: formData.destination,
      distances: formData.distances
    };

    if (isEditing && route) {
      updateSavedRoute({
        id: route.id,
        ...routeData,
      });
    } else {
      addSavedRoute(routeData);
    }

    navigate('/percorsi');
  };

  const canCalculateDistance = formData.origin.trim() && formData.destination.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          icon={<ArrowLeft size={18} />}
          onClick={() => navigate('/percorsi')}
        >
          Torna all'elenco
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Modifica Percorso' : 'Nuovo Percorso'}
        </h1>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            id="name"
            name="name"
            label="Nome Percorso"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="es. Sede Treviso - Sede Vicenza"
            required
          />

          <div className="p-4 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-start">
              <MapPin className="text-blue-500 mt-1 mr-3 flex-shrink-0" size={20} />
              <div>
                <h3 className="font-medium text-blue-800">Suggerimento</h3>
                <p className="text-sm text-blue-600 mt-1">
                  Inserisci indirizzi completi per un calcolo della distanza più accurato.
                  Esempio: "Via della Quercia 2/B, Treviso, Italia"
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo di Origine
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ITFV_OFFICES.map(office => (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, origin: office.address }))}
                  className="text-xs px-3 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {office.name}
                </button>
              ))}
            </div>
            <Input
              id="origin"
              name="origin"
              value={formData.origin}
              onChange={handleChange}
              error={errors.origin}
              placeholder="Via, numero civico, città"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Indirizzo di Destinazione
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ITFV_OFFICES.map(office => (
                <button
                  key={office.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, destination: office.address }))}
                  className="text-xs px-3 py-1 rounded-full border border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {office.name}
                </button>
              ))}
            </div>
            <Input
              id="destination"
              name="destination"
              value={formData.destination}
              onChange={handleChange}
              error={errors.destination}
              placeholder="Via, numero civico, città"
              required
            />
          </div>

          {/* Google Maps Distance Calculator */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-100">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <div className="flex-grow">
                <h3 className="font-medium text-green-800 mb-2">Calcolo Distanza con Google Maps</h3>
                <p className="text-sm text-green-700 mb-3">
                  Clicca il pulsante qui sotto per aprire Google Maps con il percorso tra gli indirizzi inseriti. 
                  Potrai vedere le diverse opzioni di percorso (strada normale, autostrada, ecc.) e inserire 
                  manualmente le distanze nei campi sottostanti.
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

          {/* Multiple Distances Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Opzioni di Percorso</h3>
                <p className="text-sm text-gray-600">
                  Aggiungi diverse opzioni di percorso (es. strada normale, autostrada) con le rispettive distanze
                </p>
              </div>
              <Button
                type="button"
                variant="primary"
                size="sm"
                icon={<Plus size={16} />}
                onClick={addDistance}
              >
                Aggiungi Percorso
              </Button>
            </div>

            {errors.distances && (
              <p className="text-sm text-red-600">{errors.distances}</p>
            )}

            <div className="space-y-3">
              {formData.distances.map((distance, index) => (
                <div key={distance.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Edit3 className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">
                        Percorso {index + 1}
                      </span>
                    </div>
                    {formData.distances.length > 1 && (
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        icon={<Trash2 size={14} />}
                        onClick={() => removeDistance(distance.id)}
                      >
                        Rimuovi
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      id={`distance-label-${distance.id}`}
                      label="Nome Percorso"
                      value={distance.label}
                      onChange={(e) => handleDistanceChange(distance.id, 'label', e.target.value)}
                      placeholder="es. Strada Normale, Autostrada, Percorso Veloce"
                      required
                    />
                    <Input
                      id={`distance-value-${distance.id}`}
                      label="Distanza (km)"
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={distance.distance.toString()}
                      onChange={(e) => handleDistanceChange(distance.id, 'distance', e.target.value)}
                      placeholder="Inserisci la distanza da Google Maps"
                      required
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <input
                        type="checkbox"
                        id={`toll-checkbox-${distance.id}`}
                        checked={distance.tollEntryStation !== undefined || distance.tollExitStation !== undefined || distance.tollAmount !== undefined}
                        onChange={(e) => handleTollCheckboxChange(distance.id, e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`toll-checkbox-${distance.id}`} className="text-sm font-medium text-gray-700">
                        Questo percorso include pedaggi autostradali
                      </label>
                    </div>

                    {(distance.tollEntryStation !== undefined || distance.tollExitStation !== undefined || distance.tollAmount !== undefined) && (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                          <div className="flex items-start">
                            <Info className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                            <div className="flex-grow">
                              <p className="text-xs text-blue-700">
                                Puoi definire un pedaggio predefinito per questo percorso. Gli importi possono essere modificati per ogni singolo viaggio.{' '}
                                <a
                                  href="https://www.infoviaggiando.it/pedaggi"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-blue-800 inline-flex items-center"
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
                            id={`toll-entry-${distance.id}`}
                            label="Casello di Entrata"
                            value={distance.tollEntryStation || ''}
                            onChange={(e) => handleDistanceChange(distance.id, 'tollEntryStation', e.target.value)}
                            placeholder="es. Treviso"
                          />
                          <Input
                            id={`toll-exit-${distance.id}`}
                            label="Casello di Uscita"
                            value={distance.tollExitStation || ''}
                            onChange={(e) => handleDistanceChange(distance.id, 'tollExitStation', e.target.value)}
                            placeholder="es. Vicenza"
                          />
                          <Input
                            id={`toll-amount-${distance.id}`}
                            label="Importo Pedaggio (€)"
                            type="number"
                            step="0.10"
                            min="0"
                            value={(distance.tollAmount || 0).toString()}
                            onChange={(e) => handleDistanceChange(distance.id, 'tollAmount', e.target.value)}
                            placeholder="es. 3.50"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              icon={<Save size={18} />}
            >
              {isEditing ? 'Salva Modifiche' : 'Salva Percorso'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SavedRouteForm;