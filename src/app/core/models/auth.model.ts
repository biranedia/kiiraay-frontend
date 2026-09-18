// Correspond exactement aux DTO du backend (sn.kiiraay.backend.securite.dto.*)

export interface LoginRequest {
  login: string;
  motDePasse: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresInMs: number;
}

// Informations extraites du payload du JWT (pas besoin d'appeler le backend pour ca)
export interface UtilisateurConnecte {
  login: string;
  autorites: string[]; // roles ("ROLE_ADMIN_GENERAL", ...) et permissions ("MEMBRE_LIRE", ...) melanges
}
