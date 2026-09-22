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
