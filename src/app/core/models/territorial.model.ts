export interface Departement {
  id: number;
  nom: string;
  code: string;
  responsableEventuel: string | null;
  regionNom: string;
  nombreCommunes: number;
}

export interface DepartementRequest {
  nom: string;
  code: string;
  responsableEventuel?: string;
  regionId: number;
}

export interface CommuneVille {
  id: number;
  nom: string;
  type: string;
  code: string;
  statut: string;
  departementNom: string;
  nombreArrondissements: number;
}

export interface CommuneVilleRequest {
  nom: string;
  type: string;
  code: string;
  departementId: number;
}

export interface Arrondissement {
  id: number;
  nom: string;
  code: string;
  communeVilleNom: string;
  nombreLocalites: number;
}

export interface ArrondissementRequest {
  nom: string;
  code: string;
  communeVilleId: number;
}

export interface Localite {
  id: number;
  nom: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  arrondissementNom: string;
}

export interface LocaliteRequest {
  nom: string;
  type: string;
  latitude?: number;
  longitude?: number;
  arrondissementId: number;
}
