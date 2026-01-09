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
  title: string
) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.setTextColor(0, 102, 102);
  doc.text(title, 14, 22);
  
  // Add institute info
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text('Istituto Veneto di Terapia Familiare', 14, 32);
  doc.setFontSize(10);
  doc.text('Via della Quercia 2/B, Treviso', 14, 38);
  
  // Add report details
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  
  const monthName = new Date(report.year, report.month).toLocaleString('it-IT', { month: 'long' });

  const roles = [];
  if (person.isDocente) roles.push('Docente');
  if (person.isAmministratore) roles.push('Amministratore');
  if (person.isDipendente) roles.push('Dipendente');
  const rolesText = roles.length > 0 ? roles.join(', ') : 'Nessun ruolo';

  doc.text(`Persona: ${person.name} ${person.surname}`, 14, 50);
  doc.text(`Ruoli: ${rolesText}`, 14, 58);
  doc.text(`Periodo: ${monthName} ${report.year}`, 14, 66);
  
  // Add summary box
  doc.setFillColor(240, 240, 240);
  doc.roundedRect(14, 75, 182, 35, 3, 3, 'F');
  doc.setFont(undefined, 'bold');
  doc.text('Riepilogo:', 18, 85);
  doc.setFont(undefined, 'normal');
  doc.text(`Totale Kilometri: ${report.totalDistance.toFixed(1)} km`, 18, 93);
  doc.text(`Rimborso Chilometrico: ${report.totalReimbursement.toFixed(2)} €`, 18, 101);
  doc.text(`Pedaggi Autostradali: ${report.totalTollFees.toFixed(2)} €`, 120, 93);
  doc.setFont(undefined, 'bold');
  doc.text(`TOTALE GENERALE: ${(report.totalReimbursement + report.totalTollFees).toFixed(2)} €`, 120, 101);
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
      // Find vehicle for this trip
      const vehicle = (globalThis as any).state?.vehicles.find(
        (v: Vehicle) => v.id === trip.vehicleId
      );

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
        vehicle ? `${rate.toFixed(4)} €` : '-',
        `${reimbursement.toFixed(2)} €`,
        toll > 0 ? `${toll.toFixed(2)} €` : '-',
        `${total.toFixed(2)} €`,
      ];
    });
    
    // @ts-ignore
    doc.autoTable({
      startY: 120,
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
    doc.text('Nessun viaggio registrato per questo periodo', 14, 120);
  }
  
  // Add signature area
  const finalY = (doc as any).lastAutoTable?.finalY || 130;
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