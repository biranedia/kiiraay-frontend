// Reponse paginee generique renvoyee par le backend (PageResponse)
export interface PageResponse<T> {
  contenu: T[];
  page: number;
  taille: number;
  totalElements: number;
  totalPages: number;
}

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
