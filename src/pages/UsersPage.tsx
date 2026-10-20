import React, { useCallback, useEffect, useState } from 'react';
import { UserPlus, Pencil, Trash2, ShieldCheck, User as UserIcon, RefreshCw } from 'lucide-react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Modal from '../components/Modal';

interface ManagedUser {
  id: string;
  email: string;
  personId: string | null;
  isAdmin: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

const callManageUsers = async <T,>(body: Record<string, unknown>): Promise<T> => {
  const { data, error } = await supabase.functions.invoke('manage-users', { body });
  if (error) {
    let message = 'Si è verificato un errore. Riprova.';
    if (error instanceof FunctionsHttpError) {
      const payload = await error.context.json().catch(() => null);
      if (payload && typeof payload.error === 'string') message = payload.error;
    }
    throw new Error(message);
  }
  return data as T;
};

interface FormState {
  email: string;
  password: string;
  personId: string;
  isAdmin: boolean;
}

const emptyForm: FormState = { email: '', password: '', personId: '', isAdmin: false };

const UsersPage: React.FC = () => {
  const { state } = useAppContext();
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [modal, setModal] = useState<{ mode: 'create' } | { mode: 'edit'; user: ManagedUser } | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const data = await callManageUsers<{ users: ManagedUser[] }>({ action: 'list' });
      if (!Array.isArray(data?.users)) throw new Error('Risposta non valida');
      setUsers(data.users.sort((a, b) => a.email.localeCompare(b.email)));
    } catch (err) {
      console.error('load users failed', err);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const personName = (personId: string | null) => {
    if (!personId) return null;
    const p = state.people.find(x => x.id === personId);
    return p ? `${p.surname} ${p.name}`.trim() : null;
  };

  const takenPersonIds = new Set(
    users
      .filter(u => u.personId && !(modal?.mode === 'edit' && modal.user.id === u.id))
      .map(u => u.personId as string)
  );

  const personOptions = state.people
    .filter(p => !takenPersonIds.has(p.id))
    .map(p => ({ value: p.id, label: `${p.surname} ${p.name}`.trim() }));

  const openCreate = () => {
    setForm(emptyForm);
    setFormError('');
    setModal({ mode: 'create' });
  };

  const openEdit = (u: ManagedUser) => {
    setForm({ email: u.email, password: '', personId: u.personId || '', isAdmin: u.isAdmin });
    setFormError('');
    setModal({ mode: 'edit', user: u });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modal) return;
    setFormError('');

    if (!form.isAdmin && !form.personId) {
      setFormError('Seleziona la persona a cui collegare l\'account');
      return;
    }

    setSaving(true);
    try {
      if (modal.mode === 'create') {
        if (form.password.length < 8) {
          setFormError('La password deve avere almeno 8 caratteri');
          setSaving(false);
          return;
        }
        await callManageUsers({
          action: 'create',
          email: form.email,
          password: form.password,
          personId: form.personId || null,
          isAdmin: form.isAdmin,
        });
        showToast('Account creato. Comunica email e password al collega.', 'success');
      } else {
        await callManageUsers({
          action: 'update',
          userId: modal.user.id,
          personId: form.personId || null,
          isAdmin: form.isAdmin,
        });
        showToast('Account aggiornato', 'success');
      }
      setModal(null);
      await loadUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Si è verificato un errore. Riprova.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: ManagedUser) => {
    try {
      await callManageUsers({ action: 'delete', userId: u.id });
      showToast('Account eliminato', 'success');
      await loadUsers();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Impossibile eliminare l\'account', 'error');
    }
  };

  const isSelf = modal?.mode === 'edit' && modal.user.id === currentUser?.id;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utenti</h1>
          <p className="text-sm text-gray-600 mt-1">
            Crea gli account dei colleghi e collegali alla loro scheda. Ogni collega vede solo i propri dati.
          </p>
        </div>
        <Button onClick={openCreate} icon={<UserPlus size={18} />}>
          Nuovo account
        </Button>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">Caricamento account...</div>
      ) : loadError ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-red-600 mb-4">Impossibile caricare gli account.</p>
          <Button variant="secondary" onClick={loadUsers} icon={<RefreshCw size={16} />}>Riprova</Button>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-500">Nessun account presente.</div>
      ) : (
        <div className="bg-white rounded-lg shadow-md divide-y divide-gray-100">
          {users.map(u => {
            const name = personName(u.personId);
            const self = u.id === currentUser?.id;
            return (
              <div key={u.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${u.isAdmin ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                  {u.isAdmin ? <ShieldCheck size={20} /> : <UserIcon size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">{u.email}</span>
                    {u.isAdmin && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Amministratore</span>
                    )}
                    {self && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">Tu</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {name ? `Collegato a ${name}` : <span className="text-red-600">Non collegato a nessuna persona</span>}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {u.lastSignInAt
                      ? `Ultimo accesso: ${new Date(u.lastSignInAt).toLocaleDateString('it-IT')}`
                      : 'Non ha ancora effettuato l\'accesso'}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(u)} icon={<Pencil size={14} />}>
                    Modifica
                  </Button>
                  {!self && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(u)}
                      confirmMessage={`Eliminare l'account ${u.email}? I dati della persona collegata (trasferte, spese, alloggi) non verranno cancellati.`}
                      icon={<Trash2 size={14} />}
                    >
                      Elimina
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal && (
        <Modal title={modal.mode === 'create' ? 'Nuovo account' : 'Modifica account'} onClose={() => !saving && setModal(null)}>
          <form onSubmit={handleSubmit}>
            <Input
              id="user-email"
              type="email"
              label="Email"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              disabled={modal.mode === 'edit'}
              required
            />
            {modal.mode === 'create' && (
              <Input
                id="user-password"
                type="text"
                label="Password iniziale (almeno 8 caratteri)"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="new-password"
                required
              />
            )}
            <Select
              id="user-person"
              label="Persona collegata"
              placeholder="Nessuna persona"
              options={personOptions}
              value={form.personId}
              onChange={e => setForm({ ...form, personId: e.target.value })}
            />
            <label className={`flex items-start gap-3 mb-4 ${isSelf ? 'opacity-60' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                className="mt-1 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                checked={form.isAdmin}
                disabled={isSelf}
                onChange={e => setForm({ ...form, isAdmin: e.target.checked })}
              />
              <span>
                <span className="block text-sm font-medium text-gray-700">Amministratore</span>
                <span className="block text-xs text-gray-500">
                  {isSelf ? 'Non puoi rimuovere i tuoi permessi di amministratore.' : 'Può vedere e gestire i dati di tutti e gli account.'}
                </span>
              </span>
            </label>

            {formError && (
              <div className="mb-4 p-3 rounded-md bg-red-50 text-sm text-red-700">{formError}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setModal(null)} disabled={saving}>Annulla</Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Salvataggio...' : modal.mode === 'create' ? 'Crea account' : 'Salva'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default UsersPage;
