export interface StatistiquesDepartementales {
  nombreDepartements: number;
  nombreArrondissements: number;
  nombreCommunesVilles: number;
  nombreLocalites: number;

  nombreCellules: number;
  cellulesParStatut: Record<string, number>;

  nombreComites: number;
  comitesComplets: number;
  comitesIncomplets: number;
  tauxRemplissageMoyen: number;

  nombreResponsables: number;

  nombreMembres: number;
  membresParStatut: Record<string, number>;

  nombreMouvements: number;
  mouvementsActifs: number;
}

export interface StatistiquesCommune {
  id: number;
  nom: string;
  type: string;
  code: string;
  nombreLocalites: number;
  nombreCellules: number;
  nombreComites: number;
  comitesComplets: number;
  comitesIncomplets: number;
  tauxRemplissageMoyen: number;
  nombreMembres: number;
}

export interface StatistiquesArrondissement {
  id: number;
  nom: string;
  code: string;
  nombreCommunesVilles: number;
  nombreLocalites: number;
  nombreCellules: number;
  nombreComites: number;
  comitesComplets: number;
  comitesIncomplets: number;
  tauxRemplissageMoyen: number;
  nombreMembres: number;
}

export interface StatistiquesLocalite {
  id: number;
  nom: string;
  type: string;
  nombreCellules: number;
  nombreComites: number;
  comitesComplets: number;
  comitesIncomplets: number;
  tauxRemplissageMoyen: number;
  nombreMembres: number;
}
