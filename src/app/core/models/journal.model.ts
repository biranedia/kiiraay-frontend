export type { PageResponse } from './pagination.model';

export interface EntreeJournal {
  id: number;
  utilisateurLogin: string | null;
  action: string;
  dateHeure: string;
  details: string | null;
  adresseIp: string | null;
}

export interface FiltresJournal {
  login?: string;
  action?: string;
  du?: string;
  au?: string;
}
