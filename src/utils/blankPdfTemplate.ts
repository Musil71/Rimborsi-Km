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

type RGB = [number, number, number];

const black: RGB = [0, 0, 0];
const darkGray: RGB = [50, 50, 50];
const medGray: RGB = [120, 120, 120];
const lightGray: RGB = [240, 240, 240];

const PAGE_W = 210;
const MARGIN_L = 12;
const MARGIN_R = 12;
const CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R;

function drawHeader(doc: jsPDF, month: number, year: number, personName?: string, pageLabel?: string) {
  doc.setDrawColor(...medGray);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, 8, PAGE_W - MARGIN_R, 8);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text('NOTA SPESE DI TRASFERTA', MARGIN_L, 15);

  if (pageLabel) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...medGray);
    doc.text(pageLabel, PAGE_W - MARGIN_R, 15, { align: 'right' });
  }

  const periodLabel = `${MONTH_NAMES_IT[month]} ${year}`;
  const subtitle = personName ? `${personName}  —  ${periodLabel}` : periodLabel;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text(subtitle, MARGIN_L, 21);

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...black);
  doc.text(COMPANY_INFO.ragioneSociale, PAGE_W - MARGIN_R, 21, { align: 'right' });

  doc.setDrawColor(...medGray);
  doc.setLineWidth(0.3);
  doc.line(MARGIN_L, 24, PAGE_W - MARGIN_R, 24);
}

function drawInfoFields(doc: jsPDF, startY: number, personName?: string): number {
  let y = startY;
  doc.setFontSize(8);
  doc.setDrawColor(...medGray);

  // Row 1: Name + Vehicle
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Nome e Cognome: ', MARGIN_L, y);
  const nameFieldX = MARGIN_L + doc.getTextWidth('Nome e Cognome: ');
  if (personName) {
    doc.setFont('helvetica', 'normal');
    doc.text(personName, nameFieldX, y);
  }
  doc.line(nameFieldX, y + 1, nameFieldX + 55, y + 1);

  const vehicleLabel = 'Veicolo: ';
  const vehicleX = MARGIN_L + 90;
  doc.setFont('helvetica', 'bold');
  doc.text(vehicleLabel, vehicleX, y);
  const vehicleLineX = vehicleX + doc.getTextWidth(vehicleLabel);
  doc.line(vehicleLineX, y + 1, PAGE_W - MARGIN_R, y + 1);

  y += 7;

  // Row 2: Role checkboxes
  doc.setFont('helvetica', 'bold');
  doc.text('Ruolo: ', MARGIN_L, y);
  const roleX = MARGIN_L + doc.getTextWidth('Ruolo: ');
  doc.setFont('helvetica', 'normal');
  const roleOptions = ['Docente', 'Amministratore', 'Dipendente'];
  roleOptions.forEach((role, i) => {
    const rx = roleX + i * 35;
    doc.rect(rx, y - 3, 3, 3);
    doc.text(role, rx + 5, y);
  });

  y += 7;

  // Row 3: Rate (separate row to avoid overlap)
  doc.setFont('helvetica', 'bold');
  doc.text('Tariffa €/km: ', MARGIN_L, y);
  const rateLineX = MARGIN_L + doc.getTextWidth('Tariffa €/km: ');
  doc.line(rateLineX, y + 1, rateLineX + 30, y + 1);

  return y + 6;
}

export function generateBlankMonthlyPdf({ month, year, personName }: BlankPdfOptions) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // ========== PAGE 1: Trips + Tolls ==========
  drawHeader(doc, month, year, personName, 'Pagina 1 — Rimborsi Km e Pedaggi');
  let y = drawInfoFields(doc, 29, personName);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Rimborsi Chilometrici e Pedaggi', MARGIN_L, y);
  y += 3;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const tripRows = Math.min(daysInMonth, 20);
  const emptyTripRows: string[][] = [];
  for (let i = 0; i < tripRows; i++) {
    emptyTripRows.push(['', '', '', '', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Origine', 'Destinazione', 'Motivo', 'A/R', 'Km', 'Ped. And.', 'Ped. Rit.']],
    body: emptyTripRows,
    theme: 'grid',
    headStyles: {
      fillColor: lightGray,
      textColor: black,
      fontStyle: 'bold',
      fontSize: 6.5,
      lineColor: medGray,
      cellPadding: 1.5,
    },
    bodyStyles: {
      textColor: darkGray,
      lineColor: medGray,
      fontSize: 6.5,
      cellPadding: 2,
      minCellHeight: 5.8,
    },
    columnStyles: {
      0: { cellWidth: 16 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 42 },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 21, halign: 'right' },
      7: { cellWidth: 21, halign: 'right' },
    },
    margin: { left: MARGIN_L, right: MARGIN_R },
  });

  y = (doc as any).lastAutoTable.finalY;

  // Totals row
  autoTable(doc, {
    startY: y,
    body: [['TOTALI', '', '', '', '', '', '', '']],
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
      0: { cellWidth: 16 },
      1: { cellWidth: 30 },
      2: { cellWidth: 30 },
      3: { cellWidth: 42 },
      4: { cellWidth: 10, halign: 'center' },
      5: { cellWidth: 16, halign: 'right' },
      6: { cellWidth: 21, halign: 'right' },
      7: { cellWidth: 21, halign: 'right' },
    },
    margin: { left: MARGIN_L, right: MARGIN_R },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // Page 1 sub-totals
  autoTable(doc, {
    startY: y,
    body: [
      ['Totale Rimborso Km', ''],
      ['Totale Pedaggi', ''],
      ['Totale Pagina 1', ''],
    ],
    theme: 'grid',
    bodyStyles: {
      textColor: darkGray,
      lineColor: medGray,
      fontSize: 8,
      cellPadding: 2.5,
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 70, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'right' },
    },
    tableWidth: 105,
    margin: { left: MARGIN_L },
  });

  // ========== PAGE 2: Expenses + Accommodations + Summary ==========
  doc.addPage();
  drawHeader(doc, month, year, personName, 'Pagina 2 — Spese e Alloggi');
  y = 30;

  // --- Meal reimbursements ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Rimborsi Pasti', MARGIN_L, y);
  y += 3;

  const emptyMealRows: string[][] = [];
  for (let i = 0; i < 6; i++) {
    emptyMealRows.push(['', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Tipo Pasto (pranzo / cena)', 'Importo €']],
    body: emptyMealRows,
    foot: [['', 'TOTALE PASTI', '']],
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
      0: { cellWidth: 24 },
      1: { cellWidth: CONTENT_W - 24 - 28 },
      2: { cellWidth: 28, halign: 'right' },
    },
    margin: { left: MARGIN_L, right: MARGIN_R },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // --- Documented expenses ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Spese Documentate (trasporto, taxi, parcheggio, altro)', MARGIN_L, y);
  y += 3;

  const emptyExpenseRows: string[][] = [];
  for (let i = 0; i < 6; i++) {
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
      0: { cellWidth: 20 },
      1: { cellWidth: 32 },
      2: { cellWidth: CONTENT_W - 20 - 32 - 40 - 24 },
      3: { cellWidth: 40 },
      4: { cellWidth: 24, halign: 'right' },
    },
    margin: { left: MARGIN_L, right: MARGIN_R },
  });

  y = (doc as any).lastAutoTable.finalY + 6;

  // --- Accommodations ---
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkGray);
  doc.text('Alloggi', MARGIN_L, y);
  y += 3;

  const emptyAccRows: string[][] = [];
  for (let i = 0; i < 4; i++) {
    emptyAccRows.push(['', '', '', '', '']);
  }

  autoTable(doc, {
    startY: y,
    head: [['Check-in', 'Check-out', 'Luogo', 'Note', 'Importo €']],
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
      0: { cellWidth: 22 },
      1: { cellWidth: 22 },
      2: { cellWidth: CONTENT_W - 22 - 22 - 40 - 24 },
      3: { cellWidth: 40 },
      4: { cellWidth: 24, halign: 'right' },
    },
    margin: { left: MARGIN_L, right: MARGIN_R },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // --- General summary ---
  autoTable(doc, {
    startY: y,
    head: [['Riepilogo Generale', 'Importo €']],
    body: [
      ['Rimborso Chilometrico', ''],
      ['Pedaggi Autostradali', ''],
      ['Rimborsi Pasti', ''],
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
      fillColor: [220, 220, 220],
      textColor: black,
      fontStyle: 'bold',
      fontSize: 9,
      lineColor: medGray,
    },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 35, halign: 'right' },
    },
    tableWidth: 115,
    margin: { left: MARGIN_L },
  });

  y = (doc as any).lastAutoTable.finalY + 14;

  // Signature
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...darkGray);
  doc.text('Data: _______________', MARGIN_L, y);
  doc.text('Firma: ______________________________________', MARGIN_L + 70, y);

  const suffix = personName
    ? `modello-vuoto_${personName.replace(/\s+/g, '-').toLowerCase()}_${MONTH_NAMES_IT[month].toLowerCase()}-${year}`
    : `modello-vuoto_${MONTH_NAMES_IT[month].toLowerCase()}-${year}`;

  doc.save(`${suffix}.pdf`);
}
