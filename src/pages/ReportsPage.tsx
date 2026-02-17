import React, { useState } from 'react';
import { FileText, Calendar, User, Banknote, AlertTriangle } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Select from '../components/Select';
import Table from '../components/Table';
import { useAppContext } from '../context/AppContext';
import { Trip } from '../types';

const ReportsPage: React.FC = () => {
  const { state, generateMonthlyReport, getPerson, getVehicle, formatDate } = useAppContext();

  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [report, setReport] = useState<any>(null);
  const [filterDocenti, setFilterDocenti] = useState(true);
  const [filterAmministratori, setFilterAmministratori] = useState(true);
  const [filterDipendenti, setFilterDipendenti] = useState(true);
  const [selectedTripRole, setSelectedTripRole] = useState<string>('all');
  const [multiRoleInfo, setMultiRoleInfo] = useState<{ hasMultipleRoles: boolean; roleCounts: Record<string, number> } | null>(null);

  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: new Date(0, i).toLocaleString('it-IT', { month: 'long' }),
  }));

  // Generate year options (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

  // Filter people by selected roles
  const filteredPeople = state.people.filter(person => {
    if (!filterDocenti && !filterAmministratori && !filterDipendenti) return true;
    return (
      (filterDocenti && person.isDocente) ||
      (filterAmministratori && person.isAmministratore) ||
      (filterDipendenti && person.isDipendente)
    );
  });

  const handleGenerateReport = () => {
    if (!selectedPerson) return;

    let reportData = generateMonthlyReport(
      selectedPerson,
      parseInt(selectedMonth),
      parseInt(selectedYear)
    );

    // Detect multi-role trips
    if (reportData) {
      const roleCounts: Record<string, number> = {
        docente: 0,
        amministratore: 0,
        dipendente: 0
      };

      reportData.trips.forEach((trip: Trip) => {
        if (trip.tripRole) {
          roleCounts[trip.tripRole] = (roleCounts[trip.tripRole] || 0) + 1;
        }
      });

      const rolesUsed = Object.entries(roleCounts).filter(([_, count]) => count > 0);
      const hasMultipleRoles = rolesUsed.length > 1;

      setMultiRoleInfo({
        hasMultipleRoles,
        roleCounts
      });
    }

    // Filter trips by selected role if not 'all'
    if (reportData && selectedTripRole !== 'all') {
      const filteredTrips = reportData.trips.filter(trip => trip.tripRole === selectedTripRole);

      // Recalculate totals for filtered trips
      let totalDistance = 0;
      let totalReimbursement = 0;
      let totalTollFees = 0;
      let totalMealReimbursement = 0;

      filteredTrips.forEach(trip => {
        const vehicle = getVehicle(trip.vehicleId);
        if (vehicle) {
          const tripDistance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
          totalDistance += tripDistance;
          totalReimbursement += tripDistance * vehicle.reimbursementRate;
        }

        if (trip.hasToll && trip.tollAmount) {
          const tollAmount = trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount;
          totalTollFees += tollAmount;
        }

        if (trip.hasMeal && trip.mealAmount) {
          totalMealReimbursement += trip.mealAmount;
        }
      });

      reportData = {
        ...reportData,
        trips: filteredTrips,
        totalDistance,
        totalReimbursement,
        totalTollFees,
        totalMealReimbursement
      };
    }

    setReport(reportData);
  };

  const getRoleBadge = (role?: string) => {
    if (!role) return null;

    const roleConfig: Record<string, { label: string; bgColor: string; textColor: string }> = {
      docente: { label: 'Docente', bgColor: 'bg-teal-100', textColor: 'text-teal-700' },
      amministratore: { label: 'Amministratore', bgColor: 'bg-blue-100', textColor: 'text-blue-700' },
      dipendente: { label: 'Dipendente', bgColor: 'bg-gray-100', textColor: 'text-gray-700' }
    };

    const config = roleConfig[role] || { label: role, bgColor: 'bg-gray-100', textColor: 'text-gray-700' };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config.bgColor} ${config.textColor}`}>
        {config.label}
      </span>
    );
  };

  const columns = [
    {
      key: 'date',
      header: 'Data',
      render: (trip: Trip) => (
        <span>{formatDate(trip.date)}</span>
      ),
    },
    {
      key: 'route',
      header: 'Percorso',
      render: (trip: Trip) => (
        <span>
          {trip.origin} → {trip.destination}
          {trip.isRoundTrip && <span className="ml-1 text-teal-600">(A/R)</span>}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Ruolo',
      render: (trip: Trip) => getRoleBadge(trip.tripRole),
    },
    {
      key: 'vehicle',
      header: 'Veicolo',
      render: (trip: Trip) => {
        const vehicle = getVehicle(trip.vehicleId);
        return vehicle ? (
          <span>
            {vehicle.make} {vehicle.model} ({vehicle.plate})
          </span>
        ) : (
          <span className="text-red-500">Veicolo non trovato</span>
        );
      },
    },
    {
      key: 'distance',
      header: 'Km',
      render: (trip: Trip) => {
        const distance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        return <span>{distance.toFixed(1)} km</span>;
      },
    },
    {
      key: 'rate',
      header: 'Tariffa (€/km)',
      render: (trip: Trip) => {
        const vehicle = getVehicle(trip.vehicleId);
        if (!vehicle) return <span>-</span>;
        return <span className="text-gray-700">{vehicle.reimbursementRate.toFixed(2)} €</span>;
      },
    },
    {
      key: 'reimbursement',
      header: 'Rimborso (€)',
      render: (trip: Trip) => {
        const vehicle = getVehicle(trip.vehicleId);
        if (!vehicle) return <span>-</span>;

        const distance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        const amount = distance * vehicle.reimbursementRate;
        return <span className="font-medium">{amount.toFixed(2)} €</span>;
      },
    },
    {
      key: 'toll',
      header: 'Pedaggio (€)',
      render: (trip: Trip) => {
        if (trip.hasToll && trip.tollAmount) {
          const toll = trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount;
          return <span className="font-medium text-amber-700">{toll.toFixed(2)} €</span>;
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'meal',
      header: 'Vitto',
      render: (trip: Trip) => {
        if (trip.hasMeal && trip.mealType && trip.mealAmount) {
          const mealLabel = trip.mealType === 'pranzo' ? 'Pranzo' : 'Cena';
          return (
            <div className="flex flex-col">
              <span className="font-medium text-green-700">{trip.mealAmount.toFixed(2)} €</span>
              <span className="text-xs text-gray-500">({mealLabel})</span>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'purpose',
      header: 'Motivo',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Report Mensili</h1>

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Genera Report Mensile</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtra per Ruolo
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterDocenti}
                  onChange={(e) => setFilterDocenti(e.target.checked)}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Docenti</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterAmministratori}
                  onChange={(e) => setFilterAmministratori(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Amministratori</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={filterDipendenti}
                  onChange={(e) => setFilterDipendenti(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Dipendenti</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="personId"
              label="Seleziona Persona"
              options={filteredPeople.map(p => {
                const roles = [];
                if (p.isDocente) roles.push('D');
                if (p.isAmministratore) roles.push('A');
                if (p.isDipendente) roles.push('Dip');
                return {
                  value: p.id,
                  label: `${p.name} ${p.surname} (${roles.join(', ')})`
                };
              })}
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
            />

            <Select
              id="tripRole"
              label="Filtra per Ruolo Trasferta"
              options={[
                { value: 'all', label: 'Tutti i ruoli' },
                { value: 'docente', label: 'Solo Docente' },
                { value: 'amministratore', label: 'Solo Amministratore' },
                { value: 'dipendente', label: 'Solo Dipendente' }
              ]}
              value={selectedTripRole}
              onChange={(e) => setSelectedTripRole(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              id="month"
              label="Mese"
              options={monthOptions}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            <Select
              id="year"
              label="Anno"
              options={yearOptions}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            />
          </div>

          <div className="mt-4">
            <Button
              variant="primary"
              icon={<FileText size={18} />}
              onClick={handleGenerateReport}
              disabled={!selectedPerson}
            >
              Genera Report
            </Button>
          </div>
        </div>

        {report && (
          <div className="border-t border-gray-200 pt-6">
            {multiRoleInfo?.hasMultipleRoles && selectedTripRole === 'all' && (
              <div className="mb-4 bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800 mb-1">
                      Attenzione: Trasferte in Più Ruoli Rilevate
                    </h3>
                    <p className="text-sm text-amber-700 mb-2">
                      Questa persona ha effettuato trasferte in ruoli diversi durante questo periodo:
                    </p>
                    <ul className="text-sm text-amber-700 list-disc list-inside mb-2">
                      {multiRoleInfo.roleCounts.docente > 0 && (
                        <li><strong>{multiRoleInfo.roleCounts.docente}</strong> trasferte come <strong>Docente</strong></li>
                      )}
                      {multiRoleInfo.roleCounts.amministratore > 0 && (
                        <li><strong>{multiRoleInfo.roleCounts.amministratore}</strong> trasferte come <strong>Amministratore</strong></li>
                      )}
                      {multiRoleInfo.roleCounts.dipendente > 0 && (
                        <li><strong>{multiRoleInfo.roleCounts.dipendente}</strong> trasferte come <strong>Dipendente</strong></li>
                      )}
                    </ul>
                    <p className="text-sm text-amber-700">
                      <strong>Raccomandazione:</strong> Si consiglia di generare report separati per ogni ruolo utilizzando il filtro "Filtra per Ruolo Trasferta" sopra.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">
                    Report: {getPerson(report.personId)?.name} {getPerson(report.personId)?.surname}
                  </h2>
                  {selectedTripRole !== 'all' && getRoleBadge(selectedTripRole)}
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' })} {report.year}
                  {selectedTripRole !== 'all' && (
                    <span className="ml-2 text-amber-600 font-medium">
                      (Report filtrato per ruolo)
                    </span>
                  )}
                </p>
              </div>
              <div className="flex space-x-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Periodo</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' })} {report.year}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${selectedTripRole !== 'all' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-300' : 'bg-green-50 border-green-100'}`}>
                <div className="flex items-center">
                  <User className={`h-8 w-8 mr-3 ${selectedTripRole !== 'all' ? 'text-amber-500' : 'text-green-500'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Totale Km
                      {selectedTripRole !== 'all' && <span className="text-xs text-amber-600 ml-1">(filtrato)</span>}
                    </h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.totalDistance.toFixed(1)} km
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${selectedTripRole !== 'all' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-300' : 'bg-teal-50 border-teal-100'}`}>
                <div className="flex items-center">
                  <FileText className={`h-8 w-8 mr-3 ${selectedTripRole !== 'all' ? 'text-amber-500' : 'text-teal-500'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Rimborso Km
                      {selectedTripRole !== 'all' && <span className="text-xs text-amber-600 ml-1">(filtrato)</span>}
                    </h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.totalReimbursement.toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${selectedTripRole !== 'all' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-300' : 'bg-amber-50 border-amber-100'}`}>
                <div className="flex items-center">
                  <Banknote className="h-8 w-8 text-amber-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Pedaggi
                      {selectedTripRole !== 'all' && <span className="text-xs text-amber-600 ml-1">(filtrato)</span>}
                    </h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.totalTollFees.toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-lg border ${selectedTripRole !== 'all' ? 'bg-amber-50 border-amber-200 ring-2 ring-amber-300' : 'bg-green-50 border-green-100'}`}>
                <div className="flex items-center">
                  <FileText className={`h-8 w-8 mr-3 ${selectedTripRole !== 'all' ? 'text-amber-500' : 'text-green-500'}`} />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">
                      Rimborsi Vitto
                      {selectedTripRole !== 'all' && <span className="text-xs text-amber-600 ml-1">(filtrato)</span>}
                    </h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.totalMealReimbursement.toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-5 rounded-lg border-2 border-purple-200 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-sm font-medium text-gray-700">Totale Generale</h3>
                    <p className="text-xs text-gray-600">Km + Pedaggi + Vitto</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {(report.totalReimbursement + report.totalTollFees + report.totalMealReimbursement).toFixed(2)} €
                </p>
              </div>
            </div>

            {report.trips.length > 0 ? (
              <Table
                columns={columns}
                data={report.trips}
                keyExtractor={(trip) => trip.id}
              />
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500">Nessuna trasferta registrata in questo periodo</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;