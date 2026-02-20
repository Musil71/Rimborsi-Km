import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import PeoplePage from './pages/PeoplePage';
import PersonForm from './pages/PersonForm';
import TripsPage from './pages/TripsPage';
import TripForm from './pages/TripForm';
import ReportsPage from './pages/ReportsPage';
import SavedRoutesPage from './pages/SavedRoutesPage';
import SavedRouteForm from './pages/SavedRouteForm';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ExpensesPage from './pages/ExpensesPage';
import AccommodationsPage from './pages/AccommodationsPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />

        {/* Persone routes */}
        <Route path="persone" element={<PeoplePage />} />
        <Route path="persone/nuovo" element={<PersonForm />} />
        <Route path="persone/:id" element={<PersonForm />} />

        {/* Tragitti routes */}
        <Route path="tragitti" element={<TripsPage />} />
        <Route path="tragitti/nuovo" element={<TripForm />} />
        <Route path="tragitti/:id" element={<TripForm />} />

        {/* Percorsi salvati routes */}
        <Route path="percorsi" element={<SavedRoutesPage />} />
        <Route path="percorsi/nuovo" element={<SavedRouteForm />} />
        <Route path="percorsi/:id" element={<SavedRouteForm />} />

        {/* Report routes */}
        <Route path="report" element={<ReportsPage />} />

        {/* Spese routes */}
        <Route path="spese" element={<ExpensesPage />} />

        {/* Alloggi routes */}
        <Route path="alloggi" element={<AccommodationsPage />} />
      </Route>
    </Routes>
  );
}

export default App;