import React, { useState } from 'react';
import { Building2, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { Client } from '../types';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';

interface FormState {
  name: string;
  notes: string;
}

const emptyForm: FormState = { name: '', notes: '' };

const ClientsPage: React.FC = () => {
  const { state, addClient, updateClient, deleteClient } = useAppContext();
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

  const openEdit = (client: Client) => {
    setFormData({ name: client.name, notes: client.notes });
    setErrors({});
    setEditingId(client.id);
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
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        name: formData.name.trim(),
        notes: formData.notes.trim(),
      };
      if (editingId) {
        const existing = state.clients.find(c => c.id === editingId)!;
        await updateClient({ ...existing, ...payload });
        showToast('Cliente aggiornato', 'success');
      } else {
        await addClient(payload);
        showToast('Cliente aggiunto', 'success');
      }
      closeForm();
    } catch {
      showToast('Errore durante il salvataggio', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (client: Client) => {
    if (!window.confirm(`Eliminare "${client.name}"? Le trasferte associate perderanno il riferimento al cliente.`)) return;
    try {
      await deleteClient(client.id);
      showToast('Cliente eliminato', 'success');
    } catch {
      showToast("Errore durante l'eliminazione", 'error');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
          <div className="bg-blue-100 p-2 rounded-lg">
            <Building2 className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clienti</h1>
            <p className="text-sm text-gray-500">Enti e organizzazioni per cui vengono svolte le trasferte</p>
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
            {editingId ? 'Modifica Cliente' : 'Nuovo Cliente'}
          </h2>
          <div className="space-y-4">
            <Input
              id="name"
              name="name"
              label="Nome"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              placeholder="Es. Villaggio SOS, Comune di Venezia"
              required
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Note
              </label>
              <textarea
                name="notes"
                rows={2}
                className="shadow-sm focus:ring-teal-500 focus:border-teal-500 block w-full sm:text-sm border-gray-300 rounded-md"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Note aggiuntive (opzionale)"
              />
            </div>
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

      {state.clients.length === 0 && !showForm ? (
        <Card>
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">Nessun cliente registrato</p>
            <p className="text-gray-400 text-sm mt-1">
              Aggiungi i clienti per poter associarli alle trasferte e filtrare i report
            </p>
            <Button className="mt-4" icon={<Plus size={18} />} onClick={openNew}>
              Aggiungi il primo cliente
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {state.clients.map(client => {
            const tripCount = state.trips.filter(t => t.clientId === client.id).length;
            return (
              <Card key={client.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-3 min-w-0">
                    <div className="bg-blue-50 p-2 rounded-lg flex-shrink-0 mt-0.5">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-semibold text-gray-900">{client.name}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                          {tripCount} {tripCount === 1 ? 'trasferta' : 'trasferte'}
                        </span>
                      </div>
                      {client.notes && (
                        <p className="text-sm text-gray-500 mt-0.5">{client.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 flex-shrink-0 ml-4">
                    <button
                      onClick={() => openEdit(client)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Modifica"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(client)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Elimina"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
