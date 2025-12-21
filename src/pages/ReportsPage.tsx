import React, { useState } from 'react';
import { FileText, Download, Printer, Calendar, User, Banknote } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';
import Select from '../components/Select';
import Table from '../components/Table';
import { useAppContext } from '../context/AppContext';
import { Trip } from '../types';
import { generatePDF } from '../utils/pdfGenerator';

const ReportsPage: React.FC = () => {
  const { state, generateMonthlyReport, getPerson, getVehicle, formatDate } = useAppContext();
  
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [report, setReport] = useState<any>(null);

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

  const handleGenerateReport = () => {
    if (!selectedPerson) return;
    
    const reportData = generateMonthlyReport(
      selectedPerson,
      parseInt(selectedMonth),
      parseInt(selectedYear)
    );
    
    setReport(reportData);
  };

  const handlePrintReport = () => {
    if (!report) return;
    
    const person = getPerson(report.personId);
    if (!person) return;
    
    const monthName = new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' });
    const title = `Rimborso Chilometrico - ${person.name} ${person.surname} - ${monthName} ${report.year}`;
    
    generatePDF(report, person, title);
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              id="personId"
              label="Seleziona Persona"
              options={state.people.map(p => ({ 
                value: p.id, 
                label: `${p.name} ${p.surname} (${p.role})` 
              }))}
              value={selectedPerson}
              onChange={(e) => setSelectedPerson(e.target.value)}
            />

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
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Report: {getPerson(report.personId)?.name} {getPerson(report.personId)?.surname}
                </h2>
                <p className="text-sm text-gray-600">
                  {new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' })} {report.year}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  icon={<Printer size={18} />}
                  onClick={handlePrintReport}
                >
                  Stampa
                </Button>
                <Button
                  variant="success"
                  icon={<Download size={18} />}
                  onClick={handlePrintReport}
                >
                  Scarica PDF
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <div className="flex items-center">
                  <User className="h-8 w-8 text-green-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Totale Km</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.totalDistance.toFixed(1)} km
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-teal-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Rimborso Km</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.totalReimbursement.toFixed(2)} €
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <div className="flex items-center">
                  <Banknote className="h-8 w-8 text-amber-500 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Pedaggi</h3>
                    <p className="text-lg font-semibold text-gray-900">
                      {report.totalTollFees.toFixed(2)} €
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
                    <p className="text-xs text-gray-600">Rimborso Chilometrico + Pedaggi</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-purple-900">
                  {(report.totalReimbursement + report.totalTollFees).toFixed(2)} €
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
                <p className="text-gray-500">Nessun viaggio registrato in questo periodo</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;