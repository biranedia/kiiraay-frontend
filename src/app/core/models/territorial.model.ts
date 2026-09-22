export interface Departement {
  id: number;
  nom: string;
  code: string;
  responsableEventuel: string | null;
  nombreArrondissements: number;
}

export interface DepartementRequest {
  nom: string;
  code: string;
  responsableEventuel?: string;
}

export interface Arrondissement {
  id: number;
  nom: string;
  code: string;
  departementNom: string;
  nombreCommunes: number;
}

export interface ArrondissementRequest {
  nom: string;
  code: string;
  departementId: number;
}

export interface CommuneVille {
  id: number;
  nom: string;
  type: string;
  code: string;
  statut: string;
  arrondissementNom: string;
  nombreLocalites: number;
}

export interface CommuneVilleRequest {
  nom: string;
  type: string;
  code: string;
  arrondissementId: number;
}

export interface Localite {
  id: number;
  nom: string;
  type: string;
  latitude: number | null;
  longitude: number | null;
  communeVilleNom: string;
}

export interface LocaliteRequest {
  nom: string;
  type: string;
  latitude?: number;
  longitude?: number;
  communeVilleId: number;
}
