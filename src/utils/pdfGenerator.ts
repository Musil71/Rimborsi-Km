import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { MonthlyReport } from '../types';
import { Person, Trip, Vehicle } from '../types';

// Add type augmentation for jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export const generatePDF = (
  report: MonthlyReport,
  person: Person,
  title: string,
  getVehicle: (id: string) => Vehicle | undefined,
  selectedTripRole: string = 'all'
) => {
  const doc = new jsPDF();

  // Add institute info at the top
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Istituto Veneto di Terapia Familiare', 14, 20);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(11);
  doc.text('Via della Quercia 2/B, Treviso', 14, 28);

  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 35, 196, 35);

  // Add report title
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.setFont(undefined, 'bold');
  const monthName = new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' });

  // Add role to title if filtered
  const roleLabel = selectedTripRole !== 'all' ? ` (${selectedTripRole.charAt(0).toUpperCase() + selectedTripRole.slice(1)})` : '';
  doc.text(`Rimborso Chilometrico - ${person.name} ${person.surname}${roleLabel}`, 14, 45);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${report.year}`, 14, 52);

  // Add report details
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const roles = [];
  if (person.isDocente) roles.push('Docente');
  if (person.isAmministratore) roles.push('Amministratore');
  if (person.isDipendente) roles.push('Dipendente');
  const rolesText = roles.length > 0 ? roles.join(', ') : 'Nessun ruolo';

  doc.text(`Persona: ${person.name} ${person.surname}`, 14, 62);
  doc.text(`Ruoli: ${rolesText}`, 14, 68);
  doc.text(`Periodo: ${monthName} ${report.year}`, 14, 74);

  if (selectedTripRole !== 'all') {
    doc.setFont(undefined, 'bold');
    doc.setTextColor(200, 100, 0);
    doc.text(`Report filtrato per ruolo: ${selectedTripRole.charAt(0).toUpperCase() + selectedTripRole.slice(1)}`, 14, 80);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(0, 0, 0);
  }

  // Add summary box
  const summaryY = selectedTripRole !== 'all' ? 88 : 82;
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, summaryY, 182, 35, 3, 3, 'F');
  doc.setFont(undefined, 'bold');
  doc.text('Riepilogo:', 18, summaryY + 10);
  doc.setFont(undefined, 'normal');
  doc.text(`Totale Kilometri: ${report.totalDistance.toFixed(1)} km`, 18, summaryY + 18);
  doc.text(`Rimborso Chilometrico: ${report.totalReimbursement.toFixed(2)} €`, 18, summaryY + 26);
  doc.text(`Pedaggi Autostradali: ${report.totalTollFees.toFixed(2)} €`, 120, summaryY + 18);
  doc.text(`Rimborsi Vitto: ${report.totalMealReimbursement.toFixed(2)} €`, 120, summaryY + 10);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTALE GENERALE: ${(report.totalReimbursement + report.totalTollFees + report.totalMealReimbursement).toFixed(2)} €`, 18, summaryY + 33);
  doc.setFont(undefined, 'normal');
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT');
  };
  
  // Generate trips table
  if (report.trips.length > 0) {
    const tableColumn = [
      'Data',
      'Origine',
      'Destinazione',
      'Ruolo',
      'Veicolo',
      'Km',
      'Tariffa',
      'Rimborso',
      'Pedaggio',
      'Vitto',
      'Totale'
    ];

    const getRoleLabel = (role?: string) => {
      if (!role) return '-';
      if (role === 'docente') return 'Doc';
      if (role === 'amministratore') return 'Amm';
      if (role === 'dipendente') return 'Dip';
      return role;
    };

    const tableRows = report.trips.map((trip: Trip) => {
      // Find vehicle for this trip using the provided function
      const vehicle = getVehicle(trip.vehicleId);

      const distance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
      const rate = vehicle ? vehicle.reimbursementRate : 0;
      const reimbursement = distance * rate;

      const toll = (trip.hasToll && trip.tollAmount)
        ? (trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount)
        : 0;

      const meal = (trip.hasMeal && trip.mealAmount) ? trip.mealAmount : 0;
      const mealLabel = trip.hasMeal && trip.mealAmount
        ? `${trip.mealAmount.toFixed(2)} € (${trip.mealType === 'pranzo' ? 'Pranzo' : 'Cena'})`
        : '-';

      const total = reimbursement + toll + meal;

      return [
        formatDate(trip.date),
        trip.origin.length > 12 ? trip.origin.substring(0, 12) + '...' : trip.origin,
        trip.destination.length > 12 ? trip.destination.substring(0, 12) + '...' : trip.destination,
        getRoleLabel(trip.tripRole),
        vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'N/A',
        `${distance.toFixed(1)}`,
        vehicle ? `${rate.toFixed(2)} €` : '-',
        `${reimbursement.toFixed(2)} €`,
        toll > 0 ? `${toll.toFixed(2)} €` : '-',
        mealLabel,
        `${total.toFixed(2)} €`,
      ];
    });
    
    // @ts-ignore
    const tableStartY = selectedTripRole !== 'all' ? 131 : 125;
    doc.autoTable({
      startY: tableStartY,
      head: [tableColumn],
      body: tableRows,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 128, 128],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240],
      },
      margin: { top: 10 },
      styles: {
        fontSize: 7,
        cellPadding: 1.5,
      },
      columnStyles: {
        0: { cellWidth: 16 },
        1: { cellWidth: 18 },
        2: { cellWidth: 18 },
        3: { cellWidth: 10 },
        4: { cellWidth: 26 },
        5: { cellWidth: 10 },
        6: { cellWidth: 12 },
        7: { cellWidth: 14 },
        8: { cellWidth: 12 },
        9: { cellWidth: 14 },
        10: { cellWidth: 14 },
      },
    });
  } else {
    const noTripsY = selectedTripRole !== 'all' ? 131 : 125;
    doc.text('Nessun viaggio registrato per questo periodo', 14, noTripsY);
  }
  
  // Add signature area
  const finalY = (doc as any).lastAutoTable?.finalY || 135;
  doc.text('Firma Responsabile', 14, finalY + 30);
  doc.line(14, finalY + 40, 80, finalY + 40);
  
  doc.text('Firma Beneficiario', 120, finalY + 30);
  doc.line(120, finalY + 40, 186, finalY + 40);
  
  // Add footer
  doc.setFontSize(8);
  doc.text(
    'Documento generato automaticamente dal sistema di gestione rimborsi ITFV',
    14,
    285
  );
  
  // Save the PDF
  doc.save(`rimborso_${person.surname.toLowerCase()}_${monthName}_${report.year}.pdf`);
};