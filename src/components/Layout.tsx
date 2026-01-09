import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Map, BarChart3, Menu, X, Route, LogOut } from 'lucide-react';
import { useState } from 'react';
import classNames from 'classnames';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const Layout: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { showToast } = useToast();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      showToast('Disconnesso con successo', 'success');
      navigate('/login');
      setMenuOpen(false);
    } catch (error) {
      console.error('Errore durante il logout:', error);
      showToast('Errore durante la disconnessione', 'error');
    }
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <Home size={20} /> },
    { path: '/persone', label: 'Persone', icon: <Users size={20} /> },
    { path: '/tragitti', label: 'Tragitti', icon: <Map size={20} /> },
    { path: '/percorsi', label: 'Percorsi', icon: <Route size={20} /> },
    { path: '/report', label: 'Report', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <img
              src="/logo.jpg"
              alt="ITFV Logo"
              className="h-12 w-auto object-contain"
            />
            <div className="flex flex-col">
              <span className="hidden md:inline-block text-sm leading-tight">Rimborsi Chilometrici</span>
            </div>
          </div>
          <button 
            className="md:hidden p-2" 
            onClick={toggleMenu}
            aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
          >
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={classNames(
                  "flex items-center space-x-1 py-2 px-3 rounded-md transition-colors",
                  {
                    "bg-teal-600 text-white": isActive(item.path),
                    "hover:bg-teal-600/60": !isActive(item.path)
                  }
                )}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
            {user && (
              <>
                <span className="text-white text-sm px-3">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 py-2 px-3 rounded-md transition-colors text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-14 right-0 left-0 z-50 transition-all">
          <nav className="flex flex-col p-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={classNames(
                  "flex items-center space-x-3 py-3 px-4 rounded-md transition-colors",
                  {
                    "bg-teal-100 text-teal-800": isActive(item.path),
                    "hover:bg-gray-100": !isActive(item.path)
                  }
                )}
                onClick={closeMenu}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
            {user && (
              <>
                <div className="border-t border-gray-200 my-2"></div>
                <div className="py-2 px-4 text-sm text-gray-600">
                  {user.email}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-3 py-3 px-4 rounded-md transition-colors text-red-600 hover:bg-red-50 font-medium"
                >
                  <LogOut size={20} />
                  <span>Logout</span>
                </button>
              </>
            )}
          </nav>
        </div>
      )}

      {/* Main content */}
      <main className="flex-grow container mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-4">
        <div className="container mx-auto px-4 text-center text-sm">
          <p>© {new Date().getFullYear()} Istituto Veneto di Terapia Familiare</p>
          <p className="mt-1">Via della Quercia 2/B, Treviso</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;