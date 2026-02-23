import React, { useState } from 'react';
import { MapPin, Trash2, Plus, Pencil, X, Check, Star } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { FavoriteDestination } from '../types';

interface FavFormState {
  name: string;
  address: string;
  defaultDistance: string;
}

const emptyFavForm: FavFormState = { name: '', address: '', defaultDistance: '' };

const SavedRoutesPage: React.FC = () => {
  const { state, addFavoriteDestination, updateFavoriteDestination, deleteFavoriteDestination } = useAppContext();
  const { showToast } = useToast();

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Destinazioni Abituali</h1>
        {!showFavForm && (
          <Button icon={<Plus size={18} />} onClick={openNewFav}>
            Aggiungi
          </Button>
        )}
      </div>

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
  );
};

export default SavedRoutesPage;
