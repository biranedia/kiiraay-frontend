export type TypeCellule = 'QUARTIER' | 'VILLAGE' | 'DIASPORA';

export type StatutCellule =
  | 'BROUILLON'
  | 'EN_CONSTITUTION'
  | 'EN_ATTENTE'
  | 'VALIDEE'
  | 'NON_VALIDEE'
  | 'SUSPENDUE'
  | 'INACTIVE';

export interface Cellule {
  id: number;
  code: string;
  nom: string;
  type: TypeCellule;
  pays: string | null;
  dateCreation: string;
  statut: StatutCellule;
  observations: string | null;
  localiteNom: string;
  nombreMouvements: number;
  bureauConstitue: boolean;
}

export interface CelluleRequest {
  code: string;
  nom: string;
  type: TypeCellule;
  pays?: string;
  observations?: string;
  localiteId: number;
}
