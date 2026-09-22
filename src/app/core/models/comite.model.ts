export type StatutComite = 'EN_CONSTITUTION' | 'COMPLET' | 'INCOMPLET' | 'VALIDE' | 'SUSPENDU';

export interface Responsable {
  id: number;
  nom: string;
  prenom: string;
  contact: string | null;
  nombreComitesGeres: number;
}

export interface ResponsableRequest {
  nom: string;
  prenom: string;
  contact?: string;
}

export interface Comite {
  id: number;
  code: string;
  capaciteCible: number;
  seuilAlerte: number;
  statut: StatutComite;
  celluleNom: string;
  responsableNomComplet: string;
  nombreMembresInscrits: number;
  placesRestantes: number;
  pourcentageRemplissage: number;
  alerteSeuilAtteint: boolean;
}

export interface ComiteRequest {
  code: string;
  capaciteCible?: number;
  seuilAlerte?: number;
  celluleId: number;
  responsableId: number;
}
