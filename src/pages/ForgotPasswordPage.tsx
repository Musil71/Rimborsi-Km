import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import { useToast } from '../context/ToastContext';

const ForgotPasswordPage: React.FC = () => {
  const { resetPassword } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validate = () => {
    const newErrors: { email?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email non valida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        showToast(error.message, 'error');
      } else {
        setEmailSent(true);
        showToast('Email di recupero inviata con successo', 'success');
      }
    } catch (error) {
      showToast('Errore durante l\'invio dell\'email', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Email Inviata</h1>
            <p className="text-gray-600 mb-6">
              Abbiamo inviato un link per il recupero della password all'indirizzo <strong>{email}</strong>.
              Controlla la tua casella di posta e segui le istruzioni.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Se non ricevi l'email entro qualche minuto, controlla la cartella spam.
            </p>
            <Link to="/login">
              <Button className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Torna al Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Password Dimenticata?</h1>
            <p className="text-gray-600">
              Inserisci la tua email e ti invieremo un link per reimpostare la password.
            </p>
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

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Invio in corso...' : 'Invia Link di Recupero'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-teal-600 hover:text-teal-700 font-medium inline-flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Torna al Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
