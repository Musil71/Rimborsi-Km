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
  getVehicle: (id: string) => Vehicle | undefined
) => {
  const doc = new jsPDF();

  // Add logo
  const logoImg = '/logo.jpg';
  try {
    doc.addImage(logoImg, 'JPEG', 14, 15, 25, 25);
  } catch (error) {
    console.error('Error loading logo:', error);
  }

  // Add institute info next to logo
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, 'bold');
  doc.text('Istituto Veneto di Terapia Familiare', 45, 25);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(10);
  doc.text('Via della Quercia 2/B, Treviso', 45, 32);

  // Add separator line
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 45, 196, 45);
  
  // Add report title
  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.setFont(undefined, 'bold');
  const monthName = new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' });
  doc.text(`Rimborso Chilometrico - ${person.name} ${person.surname}`, 14, 55);
  doc.setFont(undefined, 'normal');
  doc.setFontSize(12);
  doc.text(`${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${report.year}`, 14, 62);

  // Add report details
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const roles = [];
  if (person.isDocente) roles.push('Docente');
  if (person.isAmministratore) roles.push('Amministratore');
  if (person.isDipendente) roles.push('Dipendente');
  const rolesText = roles.length > 0 ? roles.join(', ') : 'Nessun ruolo';

  doc.text(`Persona: ${person.name} ${person.surname}`, 14, 72);
  doc.text(`Ruoli: ${rolesText}`, 14, 78);
  doc.text(`Periodo: ${monthName} ${report.year}`, 14, 84);
  
  // Add summary box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, 92, 182, 35, 3, 3, 'F');
  doc.setFont(undefined, 'bold');
  doc.text('Riepilogo:', 18, 102);
  doc.setFont(undefined, 'normal');
  doc.text(`Totale Kilometri: ${report.totalDistance.toFixed(1)} km`, 18, 110);
  doc.text(`Rimborso Chilometrico: ${report.totalReimbursement.toFixed(2)} €`, 18, 118);
  doc.text(`Pedaggi Autostradali: ${report.totalTollFees.toFixed(2)} €`, 120, 110);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTALE GENERALE: ${(report.totalReimbursement + report.totalTollFees).toFixed(2)} €`, 120, 118);
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
      'Veicolo',
      'Km',
      'Tariffa',
      'Rimborso',
      'Pedaggio',
      'Totale'
    ];

    const tableRows = report.trips.map((trip: Trip) => {
      // Find vehicle for this trip using the provided function
      const vehicle = getVehicle(trip.vehicleId);

      const distance = trip.isRoundTrip ? trip.distance * 2 : trip.distance;
      const rate = vehicle ? vehicle.reimbursementRate : 0;
      const reimbursement = distance * rate;

      const toll = (trip.hasToll && trip.tollAmount)
        ? (trip.isRoundTrip ? trip.tollAmount * 2 : trip.tollAmount)
        : 0;

      const total = reimbursement + toll;

      return [
        formatDate(trip.date),
        trip.origin.length > 12 ? trip.origin.substring(0, 12) + '...' : trip.origin,
        trip.destination.length > 12 ? trip.destination.substring(0, 12) + '...' : trip.destination,
        vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.plate})` : 'N/A',
        `${distance.toFixed(1)}`,
        vehicle ? `${rate.toFixed(2)} €` : '-',
        `${reimbursement.toFixed(2)} €`,
        toll > 0 ? `${toll.toFixed(2)} €` : '-',
        `${total.toFixed(2)} €`,
      ];
    });
    
    // @ts-ignore
    doc.autoTable({
      startY: 135,
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
        fontSize: 8,
        cellPadding: 2,
      },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 22 },
        2: { cellWidth: 22 },
        3: { cellWidth: 30 },
        4: { cellWidth: 13 },
        5: { cellWidth: 16 },
        6: { cellWidth: 18 },
        7: { cellWidth: 16 },
        8: { cellWidth: 18 },
      },
    });
  } else {
    doc.text('Nessun viaggio registrato per questo periodo', 14, 135);
  }
  
  // Add signature area
  const finalY = (doc as any).lastAutoTable?.finalY || 145;
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