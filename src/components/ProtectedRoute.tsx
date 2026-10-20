import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="mt-4 text-gray-600">Caricamento...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user.isAdmin && !user.personId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Account non ancora attivo</h2>
          <p className="text-gray-600 mb-6">
            Il tuo account non è ancora collegato a una persona. Chiedi all'amministratore di attivarlo.
          </p>
          <button
            onClick={() => signOut()}
            className="bg-teal-600 text-white px-6 py-2 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Esci
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
