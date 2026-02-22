import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Map, BarChart3, Menu, X, LogOut, Plus, Receipt, BedDouble, Star, Building2 } from 'lucide-react';
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
    { path: '/tragitti', label: 'Trasferte', icon: <Map size={20} /> },
    { path: '/percorsi', label: 'Destinazioni', icon: <Star size={20} /> },
    { path: '/spese', label: 'Spese', icon: <Receipt size={20} /> },
    { path: '/alloggi', label: 'Alloggi', icon: <BedDouble size={20} /> },
    { path: '/clienti', label: 'Clienti', icon: <Building2 size={20} /> },
    { path: '/report', label: 'Report', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-teal-700 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl md:text-2xl font-bold">ITFV Rimborsi Spese</h1>
              <Link
                to="/tragitti/nuovo"
                className="hidden lg:flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 px-5 rounded-lg shadow-lg transition-all duration-200 hover:scale-105"
              >
                <Plus size={20} />
                <span>Nuova Trasferta</span>
              </Link>
            </div>

            <div className="flex items-center space-x-2">
              <Link
                to="/tragitti/nuovo"
                className="lg:hidden flex items-center space-x-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-3 rounded-lg shadow-lg transition-all"
              >
                <Plus size={18} />
                <span className="hidden sm:inline">Nuovo</span>
              </Link>

              <button
                className="md:hidden p-2 hover:bg-teal-600 rounded-lg transition-colors"
                onClick={toggleMenu}
                aria-label={menuOpen ? "Chiudi menu" : "Apri menu"}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

              <nav className="hidden md:flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={classNames(
                      "flex items-center space-x-1 py-2 px-3 rounded-md transition-colors text-sm",
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
                    <span className="text-white text-sm px-2 border-l border-teal-500 ml-2">{user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-1 py-2 px-3 rounded-md transition-colors hover:bg-teal-600/60 text-sm"
                    >
                      <LogOut size={18} />
                      <span>Logout</span>
                    </button>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white shadow-lg absolute top-20 right-0 left-0 z-50 transition-all">
          <nav className="flex flex-col p-4">
            <Link
              to="/tragitti/nuovo"
              className="flex items-center justify-center space-x-3 py-4 px-4 mb-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-lg shadow-lg transition-all"
              onClick={closeMenu}
            >
              <Plus size={24} />
              <span>Nuova Trasferta</span>
            </Link>

            <div className="border-t border-gray-200 mb-2"></div>

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