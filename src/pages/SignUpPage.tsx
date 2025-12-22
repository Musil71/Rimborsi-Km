import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import Input from '../components/Input';
import Select from '../components/Select';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const SignUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const { state } = useAppContext();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [personId, setPersonId] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    personId?: string;
  }>({});

  const peopleOptions = state.people.map((person) => ({
    value: person.id,
    label: `${person.name} ${person.surname}`,
  }));

  const validate = () => {
    const newErrors: {
      email?: string;
      password?: string;
      confirmPassword?: string;
      personId?: string;
    } = {};

    if (!email.trim()) {
      newErrors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email non valida';
    }

    if (!password) {
      newErrors.password = 'Password obbligatoria';
    } else if (password.length < 8) {
      newErrors.password = 'La password deve contenere almeno 8 caratteri';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Conferma password obbligatoria';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Le password non corrispondono';
    }

    if (!personId) {
      newErrors.personId = 'Seleziona una persona';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await signUp(email, password, personId);

      if (error) {
        if (error.message.includes('already registered')) {
          showToast('Questa email è già registrata', 'error');
        } else {
          showToast(error.message, 'error');
        }
      } else {
        showToast('Registrazione completata! Ora puoi accedere.', 'success');
        navigate('/login');
      }
    } catch (error) {
      showToast('Errore durante la registrazione', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Registrati</h1>
            <p className="text-gray-600">Crea il tuo account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Select
              label="Seleziona Persona"
              value={personId}
              onChange={(e) => setPersonId(e.target.value)}
              options={peopleOptions}
              error={errors.personId}
              placeholder="Seleziona..."
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              placeholder="nome@esempio.it"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
              autoComplete="new-password"
              hint="Minimo 8 caratteri"
            />

            <Input
              label="Conferma Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              placeholder="••••••••"
              autoComplete="new-password"
            />

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Registrazione in corso...' : 'Registrati'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Hai già un account?{' '}
              <Link
                to="/login"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Accedi
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
