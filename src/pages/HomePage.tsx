import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Map, BarChart3, Route, Plus, ArrowRight } from 'lucide-react';
import Card from '../components/Card';
import { useAppContext } from '../context/AppContext';

const HomePage: React.FC = () => {
  const { state } = useAppContext();

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  // Count trips for current month
  const currentMonthTrips = state.trips.filter(trip => {
    const tripDate = new Date(trip.date);
    return tripDate.getMonth() === currentMonth && tripDate.getFullYear() === currentYear;
  });

  const stats = [
    {
      title: 'Persone',
      value: state.people.length,
      icon: <Users className="h-8 w-8 text-blue-500" />,
      link: '/persone',
      color: 'bg-blue-100'
    },
    {
      title: 'Trasferte Totali',
      value: state.trips.length,
      icon: <Map className="h-8 w-8 text-purple-500" />,
      link: '/tragitti',
      color: 'bg-purple-100'
    },
    {
      title: 'Trasferte Questo Mese',
      value: currentMonthTrips.length,
      icon: <BarChart3 className="h-8 w-8 text-amber-500" />,
      link: '/report',
      color: 'bg-amber-100'
    },
    {
      title: 'Destinazioni Abituali',
      value: state.savedRoutes.length,
      icon: <Route className="h-8 w-8 text-rose-500" />,
      link: '/percorsi',
      color: 'bg-rose-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Gestione Rimborsi Spese di Trasferta
        </h1>
        <p className="mt-2 text-gray-600">
          Istituto Veneto di Terapia Familiare
        </p>
      </div>

      <Link
        to="/tragitti/nuovo"
        className="block group"
      >
        <div className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl shadow-xl p-8 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 backdrop-blur-sm p-5 rounded-2xl">
                <Plus size={48} className="text-white" />
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold mb-2">Nuova Trasferta</h2>
                <p className="text-amber-50 text-lg">
                  Registra una nuova trasferta con chilometri, pedaggi e vitto
                </p>
              </div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full group-hover:bg-white/30 transition-colors">
              <ArrowRight size={32} className="text-white" />
            </div>
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} to={stat.link} className="transition-transform hover:scale-105">
            <Card className="h-full hover:shadow-lg transition-shadow">
              <div className="flex items-center">
                <div className={`${stat.color} p-4 rounded-lg mr-4`}>
                  {stat.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{stat.title}</h3>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card title="Benvenuto nell'applicazione">
        <p className="text-gray-600 mb-4">
          Questa applicazione ti permette di gestire i rimborsi spese di trasferta (chilometri, pedaggi e vitto)
          per il personale dell'Istituto Veneto di Terapia Familiare.
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Funzionalità:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Gestione unificata di persone e veicoli</li>
              <li>Tracciamento trasferte con calcolo automatico dei rimborsi</li>
              <li>Supporto per chilometri, pedaggi autostradali e vitto</li>
              <li>Percorsi salvati con opzioni multiple di distanza</li>
              <li>Selezione automatica del veicolo per persona</li>
              <li>Generazione di report mensili dettagliati</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Per iniziare:</h4>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Aggiungi il personale e i loro veicoli in <Link to="/persone" className="text-teal-600 hover:underline">Persone</Link></li>
              <li>Crea destinazioni abituali in <Link to="/percorsi" className="text-teal-600 hover:underline">Destinazioni Abituali</Link></li>
              <li>Registra le trasferte in <Link to="/tragitti" className="text-teal-600 hover:underline">Trasferte</Link></li>
              <li>Genera report mensili nella sezione <Link to="/report" className="text-teal-600 hover:underline">Report</Link></li>
            </ul>
          </div>
        </div>
      </Card>

      <Card title="Novità - Gestione Completa Trasferte">
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
          <h4 className="font-semibold text-teal-800 mb-2">💰 Rimborsi completi</h4>
          <p className="text-teal-700 text-sm mb-3">
            Ora puoi gestire tutte le spese di trasferta in un'unica soluzione: chilometri, pedaggi autostradali e rimborsi vitto (pranzo/cena).
          </p>

          <h4 className="font-semibold text-teal-800 mb-2">🚗 Veicoli integrati</h4>
          <p className="text-teal-700 text-sm mb-3">
            Gestisci i veicoli direttamente dalla pagina di ogni persona. Il veicolo viene automaticamente selezionato durante l'inserimento della trasferta.
          </p>

          <h4 className="font-semibold text-teal-800 mb-2">🛣️ Percorsi con opzioni multiple</h4>
          <p className="text-teal-700 text-sm">
            I percorsi salvati supportano più opzioni di distanza (strada normale, autostrada, ecc.) con pedaggi preimpostati.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default HomePage;