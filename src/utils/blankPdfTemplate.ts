import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY_INFO } from './itfvOffices';

const MONTH_NAMES_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

interface BlankPdfOptions {
  month: number;
  year: number;
  personName?: string;
}

export function generateBlankMonthlyPdf({ month, year, personName }: BlankPdfOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const black: [number, number, number] = [0, 0, 0];
  const darkGray: [number, number, number] = [50, 50, 50];
  const medGray: [number, number, number] = [120, 120, 120];
  const lightGray: [number, number, number] = [240, 240, 240];

  const pageW = 297;
  const marginL = 12;
  const marginR = 12;
  const contentW = pageW - marginL - marginR;

  // --- Header ---
  doc.setDrawColor(...medGray);
  doc.setLineWidth(0.3);
  doc.line(marginL, 8, pageW - marginR, 8);

  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('NOTA SPESE DI TRASFERTA — Modello Vuoto', marginL, 16);

  const periodLabel = `${MONTH_NAMES_IT[month]} ${year}`;
  const subtitle = personName
    ? `${personName}  |  ${periodLabel}`
    : periodLabel;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(subtitle, marginL, 22);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(COMPANY_INFO.ragioneSociale, pageW - marginR, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.setFontSize(7.5);
  doc.text(`P.IVA / C.F.: ${COMPANY_INFO.partitaIva}`, pageW - marginR, 17, { align: 'right' });
  doc.text(`REA: ${COMPANY_INFO.rea}`, pageW - marginR, 22, { align: 'right' });

  doc.setDrawColor(...medGray);
  doc.setLineWidth(0.3);
  doc.line(marginL, 26, pageW - marginR, 26);

  let y = 30;

  // --- Info fields ---
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Nome e Cognome: ', marginL, y);
  const nameFieldX = marginL + doc.getTextWidth('Nome e Cognome: ');
  if (personName) {
    doc.setFont('helvetica', 'normal');
    doc.text(personName, nameFieldX, y);
  }
  doc.setDrawColor(...medGray);
  doc.line(nameFieldX, y + 1, nameFieldX + 70, y + 1);

  const vehicleLabel = 'Veicolo (marca/modello/targa): ';
  const vehicleX = marginL + 100;
  doc.setFont('helvetica', 'bold');
  doc.text(vehicleLabel, vehicleX, y);
  const vehicleLineX = vehicleX + doc.getTextWidth(vehicleLabel);
  doc.line(vehicleLineX, y + 1, pageW - marginR, y + 1);

  y += 7;

  doc.setFont('helvetica', 'bold');
  doc.text('Ruolo: ', marginL, y);
  const roleX = marginL + doc.getTextWidth('Ruolo: ');
  doc.setFont('helvetica', 'normal');
  const roleOptions = ['Docente', 'Amministratore', 'Dipendente'];
  roleOptions.forEach((role, i) => {
    const rx = roleX + i * 40;
    doc.rect(rx, y - 3, 3, 3);
    doc.text(role, rx + 5, y);
  });

  const rateLabel = 'Tariffa €/km: ';
  doc.setFont('helvetica', 'bold');
  doc.text(rateLabel, vehicleX, y);
  const rateLineX = vehicleX + doc.getTextWidth(rateLabel);
  doc.line(rateLineX, y + 1, rateLineX + 30, y + 1);

  y += 8;

  // --- Main trips table ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Rimborsi Chilometrici', marginL, y);
  y += 3;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const tripRows = Math.min(daysInMonth, 25);
  const emptyTripRows: string[][] = [];
  for (let i = 0; i < tripRows; i++) {
    emptyTripRows.push(['', '', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Origine', 'Destinazione', 'Motivo', 'A/R', 'Km', 'Pedaggio And.', 'Pedaggio Rit.', 'Pasti €']],
    body: emptyTripRows,
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: medGray,
      cellPadding: 1.5,
    },
    bodyStyles: {
      textColor: darkGray,
      lineColor: medGray,
      fontSize: 7,
      cellPadding: 2.5,
      minCellHeight: 6,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 38 },
      2: { cellWidth: 38 },
      3: { cellWidth: 52 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: marginL, right: marginR },
  });

  y = (doc as any).lastAutoTable.finalY + 2;

  // Totals row for trips
  autoTable(doc, {
    startY: y,
    body: [
      ['TOTALI', '', '', '', '', '', '', '', ''],
    ],
    theme: 'grid',
    bodyStyles: {
      fontStyle: 'bold',
      textColor: black,
      lineColor: medGray,
      fontSize: 7,
      fillColor: lightGray,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 38 },
      2: { cellWidth: 38 },
      3: { cellWidth: 52 },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 24, halign: 'right' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 20, halign: 'right' },
    },
    margin: { left: marginL, right: marginR },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // --- Page 2: Expenses & accommodations & signature ---
  const needsNewPage = y > 160;
  if (needsNewPage) {
    doc.addPage();
    y = 15;
  }

  // Documented expenses section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Spese Documentate (trasporto, taxi, parcheggio, altro)', marginL, y);
  y += 3;

  const emptyExpenseRows: string[][] = [];
  for (let i = 0; i < 8; i++) {
    emptyExpenseRows.push(['', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Tipo Spesa', 'Dettaglio / Tratta', 'Note', 'Importo €']],
    body: emptyExpenseRows,
    foot: [['', '', '', 'TOTALE SPESE DOC.', '']],
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: medGray,
      cellPadding: 1.5,
    },
    bodyStyles: {
      textColor: darkGray,
      lineColor: medGray,
      fontSize: 7,
      cellPadding: 2.5,
      minCellHeight: 6,
    },
    footStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: medGray,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 40 },
      2: { cellWidth: contentW - 22 - 40 - 50 - 28 },
      3: { cellWidth: 50 },
      4: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: marginL, right: marginR },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Accommodations section
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Alloggi', marginL, y);
  y += 3;

  const emptyAccRows: string[][] = [];
  for (let i = 0; i < 4; i++) {
    emptyAccRows.push(['', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Data check-in', 'Data check-out', 'Luogo', 'Note', 'Importo €']],
    body: emptyAccRows,
    foot: [['', '', '', 'TOTALE ALLOGGI', '']],
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: medGray,
      cellPadding: 1.5,
    },
    bodyStyles: {
      textColor: darkGray,
      lineColor: medGray,
      fontSize: 7,
      cellPadding: 2.5,
      minCellHeight: 6,
    },
    footStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: 'bold',
      fontSize: 7,
      lineColor: medGray,
    },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 28 },
      2: { cellWidth: contentW - 28 - 28 - 50 - 28 },
      3: { cellWidth: 50 },
      4: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: marginL, right: marginR },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Summary box
  autoTable(doc, {
    startY: y,
    head: [['Riepilogo Generale', 'Importo €']],
    body: [
      ['Rimborso Chilometrico', ''],
      ['Pedaggi Autostradali', ''],
      ['Rimborsi Vitto (Pasti)', ''],
      ['Spese Documentate', ''],
      ['Alloggi', ''],
    ],
    foot: [['TOTALE RIMBORSO SPESE', '']],
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: 'bold',
      fontSize: 8,
      lineColor: medGray,
    },
    bodyStyles: {
      textColor: darkGray,
      lineColor: medGray,
      fontSize: 8,
      cellPadding: 2.5,
      minCellHeight: 7,
    },
    footStyles: {
      fillColor: [230, 230, 230],
      textColor: black,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: medGray,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 40, halign: 'right' },
    },
    tableWidth: 120,
    margin: { left: marginL, right: marginR },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  if (y > 175) {
    doc.addPage();
    y = 20;
  }

  // Signature area
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);

  doc.text('Data: _______________', marginL, y);
  doc.text('Firma: ______________________________________', marginL + 80, y);

  const suffix = personName
    ? `modello-vuoto_${personName.replace(/\s+/g, '-').toLowerCase()}_${MONTH_NAMES_IT[month].toLowerCase()}-${year}`
    : `modello-vuoto_${MONTH_NAMES_IT[month].toLowerCase()}-${year}`;

  doc.save(`${suffix}.pdf`);
}
