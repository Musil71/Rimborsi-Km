import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
import PeoplePage from './pages/PeoplePage';
import PersonForm from './pages/PersonForm';
import TripsPage from './pages/TripsPage';
import TripForm from './pages/TripForm';
import ReportsPage from './pages/ReportsPage';
import SavedRoutesPage from './pages/SavedRoutesPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ExpensesPage from './pages/ExpensesPage';
import AccommodationsPage from './pages/AccommodationsPage';
import PersonTripsPage from './pages/PersonTripsPage';
import VehicleRatesPage from './pages/VehicleRatesPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<HomePage />} />

        {/* Persone routes */}
        <Route path="persone" element={<AdminRoute><PeoplePage /></AdminRoute>} />
        <Route path="persone/nuovo" element={<AdminRoute><PersonForm /></AdminRoute>} />
        <Route path="persone/:id" element={<AdminRoute><PersonForm /></AdminRoute>} />

        {/* Tragitti routes */}
        <Route path="tragitti" element={<TripsPage />} />
        <Route path="tragitti/persona/:id" element={<PersonTripsPage />} />
        <Route path="tragitti/nuovo" element={<TripForm />} />
        <Route path="tragitti/:id" element={<TripForm />} />

        {/* Destinazioni abituali */}
        <Route path="percorsi" element={<SavedRoutesPage />} />

        {/* Report routes */}
        <Route path="report" element={<ReportsPage />} />

        {/* Spese routes */}
        <Route path="spese" element={<ExpensesPage />} />

        {/* Alloggi routes */}
        <Route path="alloggi" element={<AccommodationsPage />} />

        {/* Tariffe routes */}
        <Route path="tariffe" element={<AdminRoute><VehicleRatesPage /></AdminRoute>} />

        <Route path="utenti" element={<AdminRoute><UsersPage /></AdminRoute>} />

      </Route>
    </Routes>
  );
}

export default App;