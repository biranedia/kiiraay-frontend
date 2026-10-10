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
  // Tracabilite du workflow ("qui, quand") : null tant que l'etape n'a pas eu lieu
  soumisPar: string | null;
  dateSoumission: string | null;
  decisionPar: string | null;
  dateDecision: string | null;
}

export interface CelluleRequest {
  code: string;
  nom: string;
  type: TypeCellule;
  pays?: string;
  observations?: string;
  localiteId: number;
}
