import React, { useState } from 'react';
import { Star, Plus, Pencil, Trash2, MapPin, X, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { FavoriteDestination } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

interface FormState {
  name: string;
  address: string;
  defaultDistance: string;
}

const emptyForm: FormState = { name: '', address: '', defaultDistance: '' };

const FavoriteDestinationsPage: React.FC = () => {
  const { state, addFavoriteDestination, updateFavoriteDestination, deleteFavoriteDestination } = useAppContext();
  const { showToast } = useToast();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setFormData(emptyForm);
    setErrors({});
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (dest: FavoriteDestination) => {
    setFormData({ name: dest.name, address: dest.address, defaultDistance: String(dest.defaultDistance) });
    setErrors({});
    setEditingId(dest.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
    setErrors({});
  };

  const validate = (): boolean => {
    const errs: Partial<FormState> = {};
    if (!formData.name.trim()) errs.name = 'Il nome è obbligatorio';
    if (!formData.address.trim()) errs.address = "L'indirizzo è obbligatorio";
    const dist = parseFloat(formData.defaultDistance);
    if (!formData.defaultDistance || isNaN(dist) || dist <= 0) errs.defaultDistance = 'Inserisci una distanza valida (km)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        defaultDistance: parseFloat(formData.defaultDistance)
      };
      if (editingId) {
        const existing = state.favoriteDestinations.find(d => d.id === editingId)!;
        await updateFavoriteDestination({ ...existing, ...payload });
        showToast('Destinazione aggiornata', 'success');
      } else {
        await addFavoriteDestination(payload);
        showToast('Destinazione aggiunta', 'success');
      }
      closeForm();
    } catch {
      showToast('Errore durante il salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (dest: FavoriteDestination) => {
    if (!window.confirm(`Eliminare "${dest.name}"?`)) return;
    try {
      await deleteFavoriteDestination(dest.id);
      showToast('Destinazione eliminata', 'success');
    } catch {
      showToast("Errore durante l'eliminazione", 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormState]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Star className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Destinazioni Abituali</h1>
            <p className="text-sm text-gray-500">Destinazioni frequenti con distanza predefinita</p>
          </div>
        </div>
        {!showForm && (
          <Button icon={<Plus size={18} />} onClick={openNew}>
            Aggiungi
          </Button>
        )}
      </div>

      {showForm && (
        <Card className="mb-6 border-2 border-teal-200">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            {editingId ? 'Modifica Destinazione' : 'Nuova Destinazione Abituale'}
          </h2>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Nome breve"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Es. Servizi Sociali Chioggia"
              required
            />
            <Input
              id="address"
              name="address"
              label="Indirizzo completo"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              placeholder="Es. Corso del Popolo, 1193, 30015 Chioggia"
              required
            />
            <Input
              id="defaultDistance"
              name="defaultDistance"
              label="Distanza predefinita (km)"
              type="number"
              step="0.5"
              min="0.1"
              value={formData.defaultDistance}
              onChange={handleChange}
              error={errors.defaultDistance}
              placeholder="Es. 75"
              required
            />
            <div className="flex justify-end space-x-3 pt-2">
              <Button variant="secondary" onClick={closeForm} icon={<X size={16} />}>
                Annulla
              </Button>
              <Button onClick={handleSave} disabled={saving} icon={<Check size={16} />}>
                {saving ? 'Salvataggio...' : editingId ? 'Salva modifiche' : 'Aggiungi'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {state.favoriteDestinations.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-12">
            <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Nessuna destinazione abituale</p>
            <p className="text-gray-400 text-sm mt-1">
              Aggiungi le destinazioni frequenti per velocizzare l'inserimento delle trasferte
            </p>
            <Button className="mt-4" icon={<Plus size={18} />} onClick={openNew}>
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
                    onClick={() => openEdit(dest)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Modifica"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(dest)}
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

export default FavoriteDestinationsPage;
