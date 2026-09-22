export type CategorieMouvement =
  | 'NDAWI_KIIRAAY'
  | 'JIGEENI_KIIRAAY'
  | 'KANGGAMI_KIIRAAY'
  | 'MAGGI_KIIRAAY'
  | 'WAYLAAGOY_KIIRAY'
  | 'JANGALEKATI_KIIRAAY'
  | 'DOOMI_DAARAY_KIIRAAY'
  | 'ARTISANS_KIIRAAY'
  | 'TRANSPORTEURS_KIIRAAY';

export interface Mouvement {
  id: number;
  categorie: CategorieMouvement;
  responsable: string | null;
  contact: string | null;
  effectif: number;
  dateCreation: string;
  statut: string;
  observations: string | null;
  celluleId: number;
  celluleCode: string;
}

export interface MouvementRequest {
  categorie: CategorieMouvement;
  responsable?: string;
  contact?: string;
  effectif?: number;
  dateCreation?: string;
  observations?: string;
}

export const CATEGORIES_MOUVEMENT: { valeur: CategorieMouvement; libelle: string }[] = [
  { valeur: 'NDAWI_KIIRAAY', libelle: 'Ndawi Kiiraay (jeunesse)' },
  { valeur: 'JIGEENI_KIIRAAY', libelle: 'Jigeeni Kiiraay (femmes)' },
  { valeur: 'KANGGAMI_KIIRAAY', libelle: 'Kanggami Kiiraay' },
  { valeur: 'MAGGI_KIIRAAY', libelle: 'Maggi Kiiraay' },
  { valeur: 'WAYLAAGOY_KIIRAY', libelle: 'Waylaagoy Kiiray' },
  { valeur: 'JANGALEKATI_KIIRAAY', libelle: 'Jangalekati Kiiraay (enseignants)' },
  { valeur: 'DOOMI_DAARAY_KIIRAAY', libelle: 'Doomi Daaray Kiiraay' },
  { valeur: 'ARTISANS_KIIRAAY', libelle: 'Artisans Kiiraay' },
  { valeur: 'TRANSPORTEURS_KIIRAAY', libelle: 'Transporteurs Kiiraay' }
];
