export type TypeFonction =
  | 'COORDINATEUR'
  | 'COORDINATEUR_ADJOINT'
  | 'SECRETAIRE_GENERAL'
  | 'SECRETAIRE_ORGANISATION'
  | 'TRESORIER'
  | 'CHARGE_MOBILISATION'
  | 'CHARGE_COMMUNICATION'
  | 'CHARGE_FEMMES'
  | 'CHARGE_JEUNES';

export interface FonctionBureau {
  id: number;
  typeFonction: TypeFonction;
  nom: string;
  prenom: string;
  contact: string | null;
  identifiantMembre: string | null;
  dateNomination: string | null;
  statut: string;
  bureauId: number;
}

export interface FonctionBureauRequest {
  typeFonction: TypeFonction;
  nom: string;
  prenom: string;
  contact?: string;
  identifiantMembre?: string;
  dateNomination?: string;
}

export interface BureauCellule {
  id: number;
  statut: string;
  celluleId: number;
  celluleCode: string;
  fonctions: FonctionBureau[];
}

// Les 8 fonctions fixees par le cahier des charges, dans l'ordre d'affichage attendu
export const FONCTIONS_BUREAU: { valeur: TypeFonction; libelle: string }[] = [
  { valeur: 'COORDINATEUR', libelle: 'Coordinateur' },
  { valeur: 'COORDINATEUR_ADJOINT', libelle: 'Coordinateur adjoint' },
  { valeur: 'SECRETAIRE_GENERAL', libelle: 'Secretaire general' },
  { valeur: 'SECRETAIRE_ORGANISATION', libelle: 'Secretaire a l\'organisation' },
  { valeur: 'TRESORIER', libelle: 'Tresorier' },
  { valeur: 'CHARGE_MOBILISATION', libelle: 'Charge de mobilisation' },
  { valeur: 'CHARGE_COMMUNICATION', libelle: 'Charge de communication' },
  { valeur: 'CHARGE_FEMMES', libelle: 'Charge des femmes (Jigeeni Kiiraay)' },
  { valeur: 'CHARGE_JEUNES', libelle: 'Charge des jeunes (Ndawi Kiiraay)' }
];
