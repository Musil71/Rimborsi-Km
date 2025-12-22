import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const from = (location.state as any)?.from?.pathname || '/';

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email non valida';
    }

    if (!password) {
      newErrors.password = 'Password obbligatoria';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await signIn(email, password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          showToast('Email o password non corretti', 'error');
        } else if (error.message.includes('Email not confirmed')) {
          showToast('Conferma la tua email prima di accedere', 'error');
        } else {
          showToast(error.message, 'error');
        }
      } else {
        showToast('Accesso effettuato con successo', 'success');
        navigate(from, { replace: true });
      }
    } catch (error) {
      showToast('Errore durante l\'accesso', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Accedi</h1>
            <p className="text-gray-600">Rimborsi Chilometrici ITFV</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <Link
                to="/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
              >
                Password dimenticata?
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Non hai un account?{' '}
              <Link
                to="/signup"
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                Registrati
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
