import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';
import logoUrl from '/Logo.png';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const loginSuccessful = useRef(false);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (loginSuccessful.current && user) {
      navigate(from, { replace: true });
    }
  }, [user, from, navigate]);

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
        setLoading(false);
      } else {
        showToast('Accesso effettuato con successo', 'success');
        loginSuccessful.current = true;
      }
    } catch (error) {
      showToast('Errore durante l\'accesso', 'error');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left panel — brand */}
      <div className="md:w-1/2 bg-teal-700 flex flex-col items-center justify-center py-16 px-8">
        <img
          src={logoUrl}
          alt="ITFV Logo"
          className="w-48 md:w-64 h-auto object-contain drop-shadow-lg"
        />
        <div className="mt-8 text-center">
          <h2 className="text-white text-2xl font-bold tracking-wide">Rimborsi Chilometrici</h2>
          <p className="text-teal-200 mt-2 text-sm">Gestione trasferte e spese ITFV</p>
        </div>
        <div className="mt-12 flex flex-col gap-3 text-teal-100 text-sm w-full max-w-xs">
          {['Calcolo rimborsi automatico', 'Gestione persone e veicoli', 'Report e statistiche'].map((feat) => (
            <div key={feat} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-300 flex-shrink-0" />
              <span>{feat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="md:w-1/2 flex items-center justify-center bg-gray-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Accedi</h1>
            <p className="text-gray-500 mt-1 text-sm">Inserisci le tue credenziali per continuare</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
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
            <p className="text-gray-500 text-sm">
              Non hai un account?{' '}
              <Link
                to="/signup"
                className="text-teal-600 hover:text-teal-700 font-semibold transition-colors"
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
