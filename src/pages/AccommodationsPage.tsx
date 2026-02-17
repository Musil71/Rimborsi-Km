import React, { useState } from 'react';
import { Plus, Pencil, Trash2, BedDouble } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Select from '../components/Select';
import Input from '../components/Input';
import { useAppContext } from '../context/AppContext';
import { Accommodation } from '../types';

interface AccommodationFormData {
  personId: string;
  dateFrom: string;
  dateTo: string;
  location: string;
  amount: string;
  notes: string;
}

const defaultForm = (): AccommodationFormData => ({
  personId: '',
  dateFrom: new Date().toISOString().split('T')[0],
  dateTo: new Date().toISOString().split('T')[0],
  location: '',
  amount: '',
  notes: ''
});

const AccommodationsPage: React.FC = () => {
  const { state, addAccommodation, updateAccommodation, deleteAccommodation, formatDate } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [editingAccommodation, setEditingAccommodation] = useState<Accommodation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<AccommodationFormData>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [filterPerson, setFilterPerson] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  const currentYear = new Date().getFullYear();
  const yearOptions = [
    { value: '', label: 'Tutti gli anni' },
    ...Array.from({ length: 3 }, (_, i) => ({
      value: (currentYear - i).toString(),
      label: (currentYear - i).toString()
    }))
  ];

  const filteredAccommodations = state.accommodations.filter(a => {
    if (filterPerson && a.personId !== filterPerson) return false;
    if (filterYear) {
      const from = new Date(a.dateFrom);
      const to = new Date(a.dateTo);
      const yr = parseInt(filterYear);
      if (from.getFullYear() !== yr && to.getFullYear() !== yr) return false;
    }
    return true;
  });

  const getNightCount = (dateFrom: string, dateTo: string) => {
    const diff = new Date(dateTo).getTime() - new Date(dateFrom).getTime();
    return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  };

  const openAdd = () => {
    setEditingAccommodation(null);
    setForm(defaultForm());
    setShowForm(true);
  };

  const openEdit = (acc: Accommodation) => {
    setEditingAccommodation(acc);
    setForm({
      personId: acc.personId,
      dateFrom: acc.dateFrom,
      dateTo: acc.dateTo,
      location: acc.location,
      amount: acc.amount.toString(),
      notes: acc.notes
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.personId || !form.amount) return;

    setSaving(true);
    try {
      const payload = {
        personId: form.personId,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        location: form.location,
        amount: parseFloat(form.amount),
        notes: form.notes
      };

      if (editingAccommodation) {
        await updateAccommodation({ ...payload, id: editingAccommodation.id, createdAt: editingAccommodation.createdAt });
      } else {
        await addAccommodation(payload);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteAccommodation(deleteId);
    setDeleteId(null);
  };

  const totalFiltered = filteredAccommodations.reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Alloggi</h1>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openAdd}>
          Aggiungi Alloggio
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            id="filterPerson"
            label="Persona"
            options={[
              { value: '', label: 'Tutte le persone' },
              ...state.people.map(p => ({ value: p.id, label: `${p.name} ${p.surname}` }))
            ]}
            value={filterPerson}
            onChange={e => setFilterPerson(e.target.value)}
          />
          <Select
            id="filterYear"
            label="Anno"
            options={yearOptions}
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
          />
        </div>
      </Card>

      {filteredAccommodations.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <BedDouble size={40} className="mx-auto mb-3 text-gray-300" />
            <p>Nessun alloggio trovato per i filtri selezionati.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Persona', 'Periodo', 'Notti', 'Luogo', 'Note', 'Importo', 'Azioni'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccommodations.map(acc => {
                  const person = state.people.find(p => p.id === acc.personId);
                  const nights = getNightCount(acc.dateFrom, acc.dateTo);
                  return (
                    <tr key={acc.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {person ? `${person.name} ${person.surname}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                        {formatDate(acc.dateFrom)} &rarr; {formatDate(acc.dateTo)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-700">
                          {nights} {nights === 1 ? 'notte' : 'notti'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{acc.location || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">{acc.notes || '-'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">{acc.amount.toFixed(2)} €</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(acc)}
                            className="text-teal-600 hover:text-teal-800 p-1 rounded transition-colors"
                            title="Modifica"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(acc.id)}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="Elimina"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">
                    Totale ({filteredAccommodations.length} soggiorni):
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-teal-700">{totalFiltered.toFixed(2)} €</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {showForm && (
        <Modal
          title={editingAccommodation ? 'Modifica Alloggio' : 'Nuovo Alloggio'}
          onClose={() => setShowForm(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              id="personId"
              label="Persona *"
              options={[
                { value: '', label: 'Seleziona persona...' },
                ...state.people.map(p => ({ value: p.id, label: `${p.name} ${p.surname}` }))
              ]}
              value={form.personId}
              onChange={e => setForm(f => ({ ...f, personId: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                id="dateFrom"
                label="Data inizio *"
                type="date"
                value={form.dateFrom}
                onChange={e => setForm(f => ({ ...f, dateFrom: e.target.value }))}
                required
              />
              <Input
                id="dateTo"
                label="Data fine *"
                type="date"
                value={form.dateTo}
                onChange={e => setForm(f => ({ ...f, dateTo: e.target.value }))}
                required
              />
            </div>
            <Input
              id="location"
              label="Luogo"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Città / Hotel"
            />
            <Input
              id="amount"
              label="Importo (€) *"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
            <Input
              id="notes"
              label="Note"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Note aggiuntive"
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" type="button" onClick={() => setShowForm(false)}>
                Annulla
              </Button>
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? 'Salvataggio...' : editingAccommodation ? 'Salva Modifiche' : 'Aggiungi Alloggio'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteId(null)}>
          <p className="text-gray-700 mb-6">Sei sicuro di voler eliminare questo alloggio?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Annulla</Button>
            <Button variant="danger" onClick={handleDelete}>Elimina</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AccommodationsPage;
