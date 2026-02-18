import React, { useState } from 'react';
import { FileText, Calendar, User, Banknote, AlertTriangle, Download, Receipt, BedDouble, Utensils } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '../components/Button';
import Card from '../components/Card';
import Select from '../components/Select';
import Table from '../components/Table';
import { useAppContext } from '../context/AppContext';
import { Trip, MonthlyReport, EXPENSE_TYPE_LABELS } from '../types';
import { COMPANY_INFO } from '../utils/itfvOffices';

const ReportsPage: React.FC = () => {
  const { state, generateMonthlyReport, getPerson, getVehicle, formatDate } = useAppContext();

  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [filterDocenti, setFilterDocenti] = useState(true);
  const [filterAmministratori, setFilterAmministratori] = useState(true);
  const [filterDipendenti, setFilterDipendenti] = useState(true);
  const [selectedTripRole, setSelectedTripRole] = useState<string>('all');
  const [multiRoleInfo, setMultiRoleInfo] = useState<{ hasMultipleRoles: boolean; roleCounts: Record<string, number> } | null>(null);
  const [noDataFound, setNoDataFound] = useState(false);

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i.toString(),
    label: new Date(0, i).toLocaleString('it-IT', { month: 'long' }),
  }));

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => ({
    value: (currentYear - i).toString(),
    label: (currentYear - i).toString(),
  }));

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

    setNoDataFound(false);
    let reportData = generateMonthlyReport(
      selectedPerson,
      parseInt(selectedMonth),
      parseInt(selectedYear)
    );

    if (!reportData) {
      setReport(null);
      setNoDataFound(true);
      return;
    }

    const roleCounts: Record<string, number> = { docente: 0, amministratore: 0, dipendente: 0 };
    reportData.trips.forEach((trip: Trip) => {
      if (trip.tripRole) roleCounts[trip.tripRole] = (roleCounts[trip.tripRole] || 0) + 1;
    });
    const rolesUsed = Object.entries(roleCounts).filter(([_, count]) => count > 0);
    setMultiRoleInfo({ hasMultipleRoles: rolesUsed.length > 1, roleCounts });

    if (selectedTripRole !== 'all') {
      const filteredTrips = reportData.trips.filter(t => t.tripRole === selectedTripRole);

      let totalDistance = 0, totalReimbursement = 0, totalTollFees = 0, totalMealReimbursement = 0;
      filteredTrips.forEach(trip => {
        const vehicle = getVehicle(trip.vehicleId);
        if (vehicle) {
          const d = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
          totalDistance += d;
          totalReimbursement += d * vehicle.reimbursementRate;
        }
        if (trip.hasToll && trip.tollAmount) {
          totalTollFees += trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount;
        }
        if (trip.meals && trip.meals.length > 0) {
          trip.meals.forEach(m => { totalMealReimbursement += m.amount; });
        } else if (trip.hasMeal && trip.mealAmount) {
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
    const cfg: Record<string, { label: string; bg: string; text: string }> = {
      docente: { label: 'Docente', bg: 'bg-teal-100', text: 'text-teal-700' },
      amministratore: { label: 'Amministratore', bg: 'bg-blue-100', text: 'text-blue-700' },
      dipendente: { label: 'Dipendente', bg: 'bg-gray-100', text: 'text-gray-700' }
    };
    const c = cfg[role] || { label: role, bg: 'bg-gray-100', text: 'text-gray-700' };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const getMealsTotal = (trip: Trip) => {
    if (trip.meals && trip.meals.length > 0) return trip.meals.reduce((sum, m) => sum + m.amount, 0);
    if (trip.hasMeal && trip.mealAmount) return trip.mealAmount;
    return 0;
  };

  const getMealsLabel = (trip: Trip) => {
    if (trip.meals && trip.meals.length > 0) return trip.meals.map(m => m.mealType === 'pranzo' ? 'P' : 'C').join('+');
    if (trip.hasMeal && trip.mealType) return trip.mealType === 'pranzo' ? 'Pranzo' : 'Cena';
    return '';
  };

  const handleDownloadPDF = () => {
    if (!report) return;

    const person = getPerson(report.personId);
    if (!person) return;

    const doc = new jsPDF();
    const monthName = new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' });
    const periodLabel = `${monthName} ${report.year}`;
    const personLabel = `${person.name} ${person.surname}`;

    const black: [number, number, number] = [0, 0, 0];
    const darkGray: [number, number, number] = [50, 50, 50];
    const medGray: [number, number, number] = [120, 120, 120];
    const lightGray: [number, number, number] = [240, 240, 240];
    const white: [number, number, number] = [255, 255, 255];

    doc.setDrawColor(...medGray);
    doc.setLineWidth(0.3);
    doc.line(14, 8, 196, 8);

    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('NOTA SPESE DI TRASFERTA', 14, 16);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.text(`${personLabel}  |  ${periodLabel}`, 14, 22);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text(COMPANY_INFO.ragioneSociale, 196, 12, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...darkGray);
    doc.setFontSize(7.5);
    doc.text(`P.IVA / C.F.: ${COMPANY_INFO.partitaIva}`, 196, 17, { align: 'right' });
    doc.text(`REA: ${COMPANY_INFO.rea}`, 196, 22, { align: 'right' });

    doc.setDrawColor(...medGray);
    doc.setLineWidth(0.3);
    doc.line(14, 26, 196, 26);

    let y = 34;

    const totalGeneral = report.totalReimbursement + report.totalTollFees + report.totalMealReimbursement + report.totalExpenses + report.totalAccommodations;

    autoTable(doc, {
      startY: y,
      head: [['Voce di Spesa', 'Importo']],
      body: [
        ['Rimborso Chilometrico', `${report.totalReimbursement.toFixed(2)} €`],
        ['Pedaggi Autostradali', `${report.totalTollFees.toFixed(2)} €`],
        ['Rimborsi Vitto (Pasti)', `${report.totalMealReimbursement.toFixed(2)} €`],
        ['Spese Documentate', `${report.totalExpenses.toFixed(2)} €`],
        ['Alloggi', `${report.totalAccommodations.toFixed(2)} €`],
      ],
      foot: [['TOTALE RIMBORSO SPESE', `${totalGeneral.toFixed(2)} €`]],
      theme: 'grid',
      headStyles: { fillColor: lightGray, textColor: black, fontStyle: 'bold', lineColor: medGray },
      footStyles: { fillColor: lightGray, textColor: black, fontStyle: 'bold', fontSize: 10, lineColor: medGray },
      bodyStyles: { textColor: darkGray, lineColor: lightGray },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: 14, right: 14 }
    });

    y = (doc as any).lastAutoTable.finalY + 10;

    if (report.trips.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Rimborsi Chilometrici', 14, y);
      y += 4;

      const tripRows = report.trips.map(trip => {
        const vehicle = getVehicle(trip.vehicleId);
        const dist = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        const kmReimb = vehicle ? (dist * vehicle.reimbursementRate).toFixed(2) + ' €' : '-';
        const toll = trip.hasToll && trip.tollAmount
          ? (trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount).toFixed(2) + ' €' : '-';
        const mealTotal = getMealsTotal(trip);
        const meal = mealTotal > 0 ? `${mealTotal.toFixed(2)} € (${getMealsLabel(trip)})` : '-';
        return [
          new Date(trip.date).toLocaleDateString('it-IT'),
          `${trip.origin} -> ${trip.destination}${trip.isRoundTrip ? ' (A/R)' : ''}`,
          vehicle ? vehicle.plate : '-',
          `${dist.toFixed(1)} km`,
          kmReimb, toll, meal,
          trip.purpose || '-'
        ];
      });

      autoTable(doc, {
        startY: y,
        head: [['Data', 'Percorso', 'Targa', 'Km', 'Rimborso', 'Pedaggio', 'Vitto', 'Motivo']],
        body: tripRows,
        theme: 'grid',
        headStyles: { fillColor: lightGray, textColor: black, fontStyle: 'bold', fontSize: 8, lineColor: medGray },
        bodyStyles: { fontSize: 7.5, textColor: darkGray, lineColor: lightGray },
        alternateRowStyles: { fillColor: white },
        columnStyles: { 0: { cellWidth: 18 }, 1: { cellWidth: 42 }, 2: { cellWidth: 18 }, 3: { cellWidth: 16 }, 4: { cellWidth: 18 }, 5: { cellWidth: 18 }, 6: { cellWidth: 22 } },
        margin: { left: 14, right: 14 }
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (report.expenses.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Spese di Viaggio e Trasferimento', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Data', 'Tipo', 'Dettaglio', 'Importo']],
        body: report.expenses.map(e => [
          new Date(e.date).toLocaleDateString('it-IT'),
          EXPENSE_TYPE_LABELS[e.expenseType],
          (e.fromLocation && e.toLocation) ? `${e.fromLocation} -> ${e.toLocation}` : (e.description || '-'),
          `${e.amount.toFixed(2)} €`
        ]),
        foot: [['', '', 'TOTALE', `${report.totalExpenses.toFixed(2)} €`]],
        theme: 'grid',
        headStyles: { fillColor: lightGray, textColor: black, fontStyle: 'bold', fontSize: 9, lineColor: medGray },
        bodyStyles: { textColor: darkGray, lineColor: lightGray },
        footStyles: { fontStyle: 'bold', fillColor: lightGray, textColor: black, lineColor: medGray },
        alternateRowStyles: { fillColor: white },
        columnStyles: { 3: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (report.accommodations.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('Alloggi', 14, y);
      y += 4;

      autoTable(doc, {
        startY: y,
        head: [['Periodo', 'Luogo', 'Importo']],
        body: report.accommodations.map(a => [
          `${new Date(a.dateFrom).toLocaleDateString('it-IT')} -> ${new Date(a.dateTo).toLocaleDateString('it-IT')}`,
          a.location || '-',
          `${a.amount.toFixed(2)} €`
        ]),
        foot: [['', 'TOTALE', `${report.totalAccommodations.toFixed(2)} €`]],
        theme: 'grid',
        headStyles: { fillColor: lightGray, textColor: black, fontStyle: 'bold', fontSize: 9, lineColor: medGray },
        bodyStyles: { textColor: darkGray, lineColor: lightGray },
        footStyles: { fontStyle: 'bold', fillColor: lightGray, textColor: black, lineColor: medGray },
        alternateRowStyles: { fillColor: white },
        columnStyles: { 2: { halign: 'right', fontStyle: 'bold' } },
        margin: { left: 14, right: 14 }
      });

      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (y > 230) { doc.addPage(); y = 20; }

    doc.setDrawColor(...medGray);
    doc.setLineWidth(0.3);
    doc.line(14, y, 196, y);
    y += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...black);
    doc.text('TOTALE RIMBORSO SPESE:', 14, y);
    doc.text(`${totalGeneral.toFixed(2)} €`, 196, y, { align: 'right' });
    y += 16;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    doc.text('Firmare e allegare tutta la relativa documentazione (ricevute, scontrini, biglietti, ecc.)', 14, y);
    y += 12;

    doc.setTextColor(...darkGray);
    doc.text('Firma:', 14, y);
    doc.setDrawColor(...medGray);
    doc.line(40, y, 100, y);
    doc.text('Data:', 120, y);
    doc.line(135, y, 196, y);

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(...lightGray);
      doc.setLineWidth(0.3);
      doc.line(14, 287, 196, 287);
      doc.setFontSize(7);
      doc.setTextColor(...medGray);
      doc.text(`${personLabel} - ${periodLabel}`, 14, 291);
      doc.text(`P.IVA ${COMPANY_INFO.partitaIva}`, 105, 291, { align: 'center' });
      doc.text(`Pagina ${i} di ${pageCount}`, 196, 291, { align: 'right' });
    }

    doc.save(`nota-spese_${person.surname.toLowerCase()}_${monthName.toLowerCase()}-${report.year}.pdf`);
  };

  const tripColumns = [
    {
      key: 'date',
      header: 'Data',
      render: (trip: Trip) => <span>{formatDate(trip.date)}</span>,
    },
    {
      key: 'route',
      header: 'Percorso',
      render: (trip: Trip) => (
        <span>
          {trip.origin} &rarr; {trip.destination}
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
          <span>{vehicle.make} {vehicle.model} ({vehicle.plate})</span>
        ) : <span className="text-red-500">N/D</span>;
      },
    },
    {
      key: 'distance',
      header: 'Km',
      render: (trip: Trip) => {
        const d = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        return <span>{d.toFixed(1)} km</span>;
      },
    },
    {
      key: 'reimbursement',
      header: 'Rimborso km',
      render: (trip: Trip) => {
        const vehicle = getVehicle(trip.vehicleId);
        if (!vehicle) return <span>-</span>;
        const d = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
        return <span className="font-medium">{(d * vehicle.reimbursementRate).toFixed(2)} €</span>;
      },
    },
    {
      key: 'toll',
      header: 'Pedaggio',
      render: (trip: Trip) => {
        if (trip.hasToll && trip.tollAmount) {
          const t = trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount;
          return <span className="font-medium text-amber-700">{t.toFixed(2)} €</span>;
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    {
      key: 'meal',
      header: 'Vitto',
      render: (trip: Trip) => {
        const total = getMealsTotal(trip);
        if (total > 0) {
          return (
            <div className="flex flex-col">
              <span className="font-medium text-green-700">{total.toFixed(2)} €</span>
              <span className="text-xs text-gray-500">({getMealsLabel(trip)})</span>
            </div>
          );
        }
        return <span className="text-gray-400">-</span>;
      },
    },
    { key: 'purpose', header: 'Motivo' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Report Mensili</h1>

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Genera Report Mensile</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Filtra persone per Ruolo</label>
            <div className="flex flex-wrap gap-4">
              {[
                { key: 'filterDocenti', value: filterDocenti, set: setFilterDocenti, label: 'Docenti' },
                { key: 'filterAmministratori', value: filterAmministratori, set: setFilterAmministratori, label: 'Amministratori' },
                { key: 'filterDipendenti', value: filterDipendenti, set: setFilterDipendenti, label: 'Dipendenti' },
              ].map(item => (
                <label key={item.key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={item.value}
                    onChange={e => item.set(e.target.checked)}
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select
              id="personId"
              label="Seleziona Persona"
              options={[
                { value: '', label: 'Seleziona...' },
                ...filteredPeople.map(p => {
                  const roles = [];
                  if (p.isDocente) roles.push('D');
                  if (p.isAmministratore) roles.push('A');
                  if (p.isDipendente) roles.push('Dip');
                  return { value: p.id, label: `${p.name} ${p.surname} (${roles.join(', ')})` };
                })
              ]}
              value={selectedPerson}
              onChange={e => setSelectedPerson(e.target.value)}
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
              onChange={e => setSelectedTripRole(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <Select id="month" label="Mese" options={monthOptions} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
            <Select id="year" label="Anno" options={yearOptions} value={selectedYear} onChange={e => setSelectedYear(e.target.value)} />
          </div>

          <Button variant="primary" icon={<FileText size={18} />} onClick={handleGenerateReport} disabled={!selectedPerson}>
            Genera Report
          </Button>
        </div>

        {noDataFound && (
          <div className="border-t border-gray-200 pt-6 text-center py-6">
            <p className="text-gray-500">Nessuna trasferta, spesa o alloggio registrati per il periodo selezionato.</p>
          </div>
        )}

        {report && (
          <div className="border-t border-gray-200 pt-6 space-y-6">

            {multiRoleInfo?.hasMultipleRoles && selectedTripRole === 'all' && (
              <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800 mb-1">Trasferte in Piu' Ruoli Rilevate</h3>
                    <ul className="text-sm text-amber-700 list-disc list-inside mb-2">
                      {multiRoleInfo.roleCounts.docente > 0 && <li><strong>{multiRoleInfo.roleCounts.docente}</strong> trasferte come <strong>Docente</strong></li>}
                      {multiRoleInfo.roleCounts.amministratore > 0 && <li><strong>{multiRoleInfo.roleCounts.amministratore}</strong> trasferte come <strong>Amministratore</strong></li>}
                      {multiRoleInfo.roleCounts.dipendente > 0 && <li><strong>{multiRoleInfo.roleCounts.dipendente}</strong> trasferte come <strong>Dipendente</strong></li>}
                    </ul>
                    <p className="text-sm text-amber-700">Si consiglia di generare report separati per ogni ruolo usando il filtro apposito.</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-medium text-gray-900">
                    {getPerson(report.personId)?.name} {getPerson(report.personId)?.surname}
                  </h2>
                  {selectedTripRole !== 'all' && getRoleBadge(selectedTripRole)}
                </div>
                <p className="text-sm text-gray-600">
                  {new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' })} {report.year}
                </p>
              </div>
              <Button variant="primary" icon={<Download size={18} />} onClick={handleDownloadPDF}>
                Scarica PDF
              </Button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Km totali', value: `${report.totalDistance.toFixed(1)} km`, colorClass: 'bg-blue-50 border-blue-100', icon: <User className="h-5 w-5 text-blue-500" /> },
                { label: 'Rimborso km', value: `${report.totalReimbursement.toFixed(2)} €`, colorClass: 'bg-teal-50 border-teal-100', icon: <FileText className="h-5 w-5 text-teal-500" /> },
                { label: 'Pedaggi', value: `${report.totalTollFees.toFixed(2)} €`, colorClass: 'bg-amber-50 border-amber-100', icon: <Banknote className="h-5 w-5 text-amber-500" /> },
                { label: 'Vitto (pasti)', value: `${report.totalMealReimbursement.toFixed(2)} €`, colorClass: 'bg-green-50 border-green-100', icon: <Utensils className="h-5 w-5 text-green-500" /> },
                { label: 'Spese doc.', value: `${report.totalExpenses.toFixed(2)} €`, colorClass: 'bg-orange-50 border-orange-100', icon: <Receipt className="h-5 w-5 text-orange-500" /> },
                { label: 'Alloggi', value: `${report.totalAccommodations.toFixed(2)} €`, colorClass: 'bg-sky-50 border-sky-100', icon: <BedDouble className="h-5 w-5 text-sky-500" /> },
              ].map(item => (
                <div key={item.label} className={`${item.colorClass} p-3 rounded-lg border`}>
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon}
                    <span className="text-xs font-medium text-gray-600">{item.label}</span>
                  </div>
                  <p className="text-sm font-bold text-gray-900">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 p-5 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-medium">TOTALE RIMBORSO SPESE</span>
                <span className="text-2xl font-bold text-white">
                  {(report.totalReimbursement + report.totalTollFees + report.totalMealReimbursement + report.totalExpenses + report.totalAccommodations).toFixed(2)} €
                </span>
              </div>
            </div>

            {report.trips.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FileText size={18} className="text-teal-500" />
                  Rimborsi Chilometrici ({report.trips.length} trasferte)
                </h3>
                <Table columns={tripColumns} data={report.trips} keyExtractor={t => t.id} />
              </div>
            )}

            {report.expenses.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Receipt size={18} className="text-orange-500" />
                  Spese di Viaggio e Trasferimento ({report.expenses.length} voci)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Data', 'Tipo', 'Dettaglio', 'Note', 'Importo'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.expenses.map(expense => (
                        <tr key={expense.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(expense.date)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                              {EXPENSE_TYPE_LABELS[expense.expenseType]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {expense.fromLocation && expense.toLocation
                              ? `${expense.fromLocation} → ${expense.toLocation}`
                              : expense.description || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">{expense.notes || '-'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{expense.amount.toFixed(2)} €</td>
                        </tr>
                      ))}
                      <tr className="bg-orange-50">
                        <td colSpan={4} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Totale Spese Documentate:</td>
                        <td className="px-4 py-3 text-sm font-bold text-orange-700">{report.totalExpenses.toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {report.accommodations.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <BedDouble size={18} className="text-sky-500" />
                  Alloggi ({report.accommodations.length} soggiorni)
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {['Periodo', 'Luogo', 'Note', 'Importo'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {report.accommodations.map(acc => (
                        <tr key={acc.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(acc.dateFrom)} &rarr; {formatDate(acc.dateTo)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-700">{acc.location || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-500">{acc.notes || '-'}</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">{acc.amount.toFixed(2)} €</td>
                        </tr>
                      ))}
                      <tr className="bg-sky-50">
                        <td colSpan={3} className="px-4 py-3 text-sm font-semibold text-gray-700 text-right">Totale Alloggi:</td>
                        <td className="px-4 py-3 text-sm font-bold text-sky-700">{report.totalAccommodations.toFixed(2)} €</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
