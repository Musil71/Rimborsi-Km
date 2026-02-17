import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Receipt } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import Select from '../components/Select';
import Input from '../components/Input';
import { useAppContext } from '../context/AppContext';
import { TripExpense, ExpenseType, EXPENSE_TYPE_LABELS } from '../types';

const EXPENSE_TYPE_OPTIONS = Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const EXPENSE_TYPE_HAS_ROUTE: ExpenseType[] = ['treno', 'supplemento_treno', 'aereo'];

interface ExpenseFormData {
  personId: string;
  date: string;
  expenseType: ExpenseType;
  description: string;
  fromLocation: string;
  toLocation: string;
  amount: string;
  notes: string;
}

const defaultForm = (): ExpenseFormData => ({
  personId: '',
  date: new Date().toISOString().split('T')[0],
  expenseType: 'treno',
  description: '',
  fromLocation: '',
  toLocation: '',
  amount: '',
  notes: ''
});

const ExpensesPage: React.FC = () => {
  const { state, addTripExpense, updateTripExpense, deleteTripExpense, formatDate } = useAppContext();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<TripExpense | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ExpenseFormData>(defaultForm());
  const [saving, setSaving] = useState(false);
  const [filterPerson, setFilterPerson] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth().toString());

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString()
  }));
  const monthOptions = [
    { value: '', label: 'Tutti i mesi' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: i.toString(),
      label: new Date(0, i).toLocaleString('it-IT', { month: 'long' })
    }))
  ];

  const filteredExpenses = state.tripExpenses.filter(e => {
    if (filterPerson && e.personId !== filterPerson) return false;
    const d = new Date(e.date);
    if (filterYear && d.getFullYear() !== parseInt(filterYear)) return false;
    if (filterMonth !== '' && d.getMonth() !== parseInt(filterMonth)) return false;
    return true;
  });

  const openAdd = () => {
    setEditingExpense(null);
    setForm(defaultForm());
    setShowForm(true);
  };

  const openEdit = (expense: TripExpense) => {
    setEditingExpense(expense);
    setForm({
      personId: expense.personId,
      date: expense.date,
      expenseType: expense.expenseType,
      description: expense.description,
      fromLocation: expense.fromLocation,
      toLocation: expense.toLocation,
      amount: expense.amount.toString(),
      notes: expense.notes
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
        date: form.date,
        expenseType: form.expenseType,
        description: form.description,
        fromLocation: form.fromLocation,
        toLocation: form.toLocation,
        amount: parseFloat(form.amount),
        notes: form.notes
      };

      if (editingExpense) {
        await updateTripExpense({ ...payload, id: editingExpense.id, createdAt: editingExpense.createdAt });
      } else {
        await addTripExpense(payload);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteTripExpense(deleteId);
    setDeleteId(null);
  };

  const hasRoute = EXPENSE_TYPE_HAS_ROUTE.includes(form.expenseType);

  const totalFiltered = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Spese Documentate</h1>
        <Button variant="primary" icon={<Plus size={18} />} onClick={openAdd}>
          Aggiungi Spesa
        </Button>
      </div>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          <Select
            id="filterMonth"
            label="Mese"
            options={monthOptions}
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
          />
        </div>
      </Card>

      {filteredExpenses.length === 0 ? (
        <Card>
          <div className="text-center py-8 text-gray-500">
            <Receipt size={40} className="mx-auto mb-3 text-gray-300" />
            <p>Nessuna spesa trovata per i filtri selezionati.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Data', 'Persona', 'Tipo', 'Dettaglio', 'Note', 'Importo', 'Azioni'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map(expense => {
                  const person = state.people.find(p => p.id === expense.personId);
                  return (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">{formatDate(expense.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {person ? `${person.name} ${person.surname}` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                          {EXPENSE_TYPE_LABELS[expense.expenseType]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {expense.fromLocation && expense.toLocation
                          ? `${expense.fromLocation} → ${expense.toLocation}`
                          : expense.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{expense.notes || '-'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-900 whitespace-nowrap">{expense.amount.toFixed(2)} €</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(expense)}
                            className="text-teal-600 hover:text-teal-800 p-1 rounded transition-colors"
                            title="Modifica"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteId(expense.id)}
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
                    Totale ({filteredExpenses.length} voci):
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
          title={editingExpense ? 'Modifica Spesa' : 'Nuova Spesa Documentata'}
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
            <Input
              id="date"
              label="Data *"
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              required
            />
            <Select
              id="expenseType"
              label="Tipo di Spesa *"
              options={EXPENSE_TYPE_OPTIONS}
              value={form.expenseType}
              onChange={e => setForm(f => ({ ...f, expenseType: e.target.value as ExpenseType }))}
            />
            {hasRoute ? (
              <div className="grid grid-cols-2 gap-4">
                <Input
                  id="fromLocation"
                  label="Da"
                  value={form.fromLocation}
                  onChange={e => setForm(f => ({ ...f, fromLocation: e.target.value }))}
                  placeholder="Partenza"
                />
                <Input
                  id="toLocation"
                  label="A"
                  value={form.toLocation}
                  onChange={e => setForm(f => ({ ...f, toLocation: e.target.value }))}
                  placeholder="Destinazione"
                />
              </div>
            ) : (
              <Input
                id="description"
                label="Descrizione"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Descrizione della spesa"
              />
            )}
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
                {saving ? 'Salvataggio...' : editingExpense ? 'Salva Modifiche' : 'Aggiungi Spesa'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deleteId && (
        <Modal title="Conferma Eliminazione" onClose={() => setDeleteId(null)}>
          <p className="text-gray-700 mb-6">Sei sicuro di voler eliminare questa spesa?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteId(null)}>Annulla</Button>
            <Button variant="danger" onClick={handleDelete}>Elimina</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ExpensesPage;
