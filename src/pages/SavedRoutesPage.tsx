import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { MapPin, Edit, Trash2, Search, PlusCircle, Route, Star, Plus, Pencil, X, Check } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Table from '../components/Table';
import Input from '../components/Input';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { SavedRoute, FavoriteDestination } from '../types';

interface FavFormState {
  name: string;
  address: string;
  defaultDistance: string;
}

const emptyFavForm: FavFormState = { name: '', address: '', defaultDistance: '' };

const SavedRoutesPage: React.FC = () => {
  const { state, deleteSavedRoute, addFavoriteDestination, updateFavoriteDestination, deleteFavoriteDestination } = useAppContext();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = (searchParams.get('tab') || 'destinazioni') as 'destinazioni' | 'percorsi';

  const setTab = (tab: 'destinazioni' | 'percorsi') => {
    setSearchParams({ tab });
  };

  const [searchTerm, setSearchTerm] = useState('');

  const [showFavForm, setShowFavForm] = useState(false);
  const [editingFavId, setEditingFavId] = useState<string | null>(null);
  const [favForm, setFavForm] = useState<FavFormState>(emptyFavForm);
  const [favErrors, setFavErrors] = useState<Partial<FavFormState>>({});
  const [savingFav, setSavingFav] = useState(false);

  const openNewFav = () => {
    setFavForm(emptyFavForm);
    setFavErrors({});
    setEditingFavId(null);
    setShowFavForm(true);
  };

  const openEditFav = (dest: FavoriteDestination) => {
    setFavForm({ name: dest.name, address: dest.address, defaultDistance: String(dest.defaultDistance) });
    setFavErrors({});
    setEditingFavId(dest.id);
    setShowFavForm(true);
  };

  const closeFavForm = () => {
    setShowFavForm(false);
    setEditingFavId(null);
    setFavForm(emptyFavForm);
    setFavErrors({});
  };

  const validateFav = (): boolean => {
    const errs: Partial<FavFormState> = {};
    if (!favForm.name.trim()) errs.name = 'Il nome è obbligatorio';
    if (!favForm.address.trim()) errs.address = "L'indirizzo è obbligatorio";
    const dist = parseFloat(favForm.defaultDistance);
    if (!favForm.defaultDistance || isNaN(dist) || dist <= 0) errs.defaultDistance = 'Inserisci una distanza valida (km)';
    setFavErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFavSave = async () => {
    if (!validateFav()) return;
    setSavingFav(true);
    try {
      const payload = {
        name: favForm.name.trim(),
        address: favForm.address.trim(),
        defaultDistance: parseFloat(favForm.defaultDistance),
      };
      if (editingFavId) {
        const existing = state.favoriteDestinations.find(d => d.id === editingFavId)!;
        await updateFavoriteDestination({ ...existing, ...payload });
        showToast('Destinazione aggiornata', 'success');
      } else {
        await addFavoriteDestination(payload);
        showToast('Destinazione aggiunta', 'success');
      }
      closeFavForm();
    } catch {
      showToast('Errore durante il salvataggio', 'error');
    } finally {
      setSavingFav(false);
    }
  };

  const handleFavDelete = async (dest: FavoriteDestination) => {
    if (!window.confirm(`Eliminare "${dest.name}"?`)) return;
    try {
      await deleteFavoriteDestination(dest.id);
      showToast('Destinazione eliminata', 'success');
    } catch {
      showToast("Errore durante l'eliminazione", 'error');
    }
  };

  const handleFavChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFavForm(prev => ({ ...prev, [name]: value }));
    if (favErrors[name as keyof FavFormState]) {
      setFavErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleDeleteRoute = (id: string) => {
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

  const routeColumns = [
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
          {route.distances.map((distance) => (
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
        <div className="flex flex-col items-stretch space-y-2">
          <Button
            variant="info"
            size="sm"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/percorsi/${route.id}`);
            }}
            className="w-full"
          >
            Modifica
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteRoute(route.id);
            }}
            className="w-full"
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
        <h1 className="text-2xl font-bold text-gray-800">Destinazioni & Percorsi</h1>
        {activeTab === 'percorsi' && (
          <Link to="/percorsi/nuovo">
            <Button variant="primary" icon={<PlusCircle size={18} />}>
              Nuovo Percorso
            </Button>
          </Link>
        )}
        {activeTab === 'destinazioni' && !showFavForm && (
          <Button icon={<Plus size={18} />} onClick={openNewFav}>
            Aggiungi
          </Button>
        )}
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          <button
            onClick={() => setTab('destinazioni')}
            className={`flex items-center space-x-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'destinazioni'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Star size={16} />
            <span>Destinazioni abituali</span>
            {state.favoriteDestinations.length > 0 && (
              <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'destinazioni' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {state.favoriteDestinations.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('percorsi')}
            className={`flex items-center space-x-2 py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'percorsi'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Route size={16} />
            <span>Percorsi con opzioni</span>
            {state.savedRoutes.length > 0 && (
              <span className={`ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                activeTab === 'percorsi' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
              }`}>
                {state.savedRoutes.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'destinazioni' && (
        <div className="space-y-4">
          {showFavForm && (
            <Card className="border-2 border-teal-200">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {editingFavId ? 'Modifica Destinazione' : 'Nuova Destinazione Abituale'}
              </h2>
              <div className="space-y-4">
                <Input
                  id="fav-name"
                  name="name"
                  label="Nome breve"
                  value={favForm.name}
                  onChange={handleFavChange}
                  error={favErrors.name}
                  placeholder="Es. Servizi Sociali Chioggia"
                  required
                />
                <Input
                  id="fav-address"
                  name="address"
                  label="Indirizzo completo"
                  value={favForm.address}
                  onChange={handleFavChange}
                  error={favErrors.address}
                  placeholder="Es. Corso del Popolo, 1193, 30015 Chioggia"
                  required
                />
                <Input
                  id="fav-defaultDistance"
                  name="defaultDistance"
                  label="Distanza predefinita (km)"
                  type="number"
                  step="0.5"
                  min="0.1"
                  value={favForm.defaultDistance}
                  onChange={handleFavChange}
                  error={favErrors.defaultDistance}
                  placeholder="Es. 75"
                  required
                />
                <div className="flex justify-end space-x-3 pt-2">
                  <Button variant="secondary" onClick={closeFavForm} icon={<X size={16} />}>
                    Annulla
                  </Button>
                  <Button onClick={handleFavSave} disabled={savingFav} icon={<Check size={16} />}>
                    {savingFav ? 'Salvataggio...' : editingFavId ? 'Salva modifiche' : 'Aggiungi'}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {state.favoriteDestinations.length === 0 && !showFavForm ? (
            <Card>
              <div className="text-center py-12">
                <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">Nessuna destinazione abituale</p>
                <p className="text-gray-400 text-sm mt-1">
                  Aggiungi le destinazioni frequenti per velocizzare l'inserimento delle trasferte
                </p>
                <Button className="mt-4" icon={<Plus size={18} />} onClick={openNewFav}>
                  Aggiungi la prima destinazione
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {state.favoriteDestinations.map(dest => (
                <Card key={dest.id} className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="bg-amber-50 p-2 rounded-lg flex-shrink-0 mt-0.5">
                        <MapPin className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="font-semibold text-gray-900">{dest.name}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                            {dest.defaultDistance} km
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">{dest.address}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                      <button
                        onClick={() => openEditFav(dest)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Modifica"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleFavDelete(dest)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Elimina"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'percorsi' && (
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

          <Table
            columns={routeColumns}
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
      )}
    </div>
  );
};

export default SavedRoutesPage;
