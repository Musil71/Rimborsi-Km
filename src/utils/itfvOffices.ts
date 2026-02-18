export interface ItfvOffice {
  id: string;
  name: string;
  address: string;
}

export const ITFV_OFFICES: ItfvOffice[] = [
  {
    id: 'treviso',
    name: 'Sede Treviso',
    address: 'Via della Quercia 2/B, 31100 Treviso',
  },
  {
    id: 'marcon',
    name: 'Sede Marcon',
    address: 'Viale della Stazione 3, 30020 Marcon',
  },
  {
    id: 'vicenza',
    name: 'Sede Vicenza',
    address: 'Via Pola 30, Torri di Quartesolo, Vicenza',
  },
];

export const DEFAULT_OFFICE = ITFV_OFFICES[0];

export const COMPANY_INFO = {
  ragioneSociale: 'ISTITUTO VENETO DI TERAPIA FAMILIARE S.R.L.',
  partitaIva: '02034280269',
  codiceFiscale: '02034280269',
  rea: '184910',
};
