export interface Region {
  id: number;
  nom: string;
  code: string;
  statut: string;
  nombreDepartements: number;
}

export interface RegionRequest {
  nom: string;
  code: string;
}
