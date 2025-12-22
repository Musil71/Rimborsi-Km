import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  const { showToast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      password?: string;
      confirmPassword?: string;
    } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        showToast(error.message, 'error');
      } else {
        showToast('Password aggiornata con successo', 'success');
        navigate('/login');
      }
    } catch (error) {
      showToast('Errore durante l\'aggiornamento della password', 'error');
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
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reimposta Password</h1>
            <p className="text-gray-600">
              Inserisci la tua nuova password
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Nuova Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              placeholder="••••••••"
              autoComplete="new-password"
              hint="Minimo 8 caratteri"
            />

            <Input
              label="Conferma Nuova Password"
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
              {loading ? 'Aggiornamento in corso...' : 'Aggiorna Password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
