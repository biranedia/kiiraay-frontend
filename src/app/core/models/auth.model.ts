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

// Creation d'un compte par un administrateur : aucun mot de passe ici, l'utilisateur le
// definit lui-meme via le lien d'activation envoye par email (voir ActivationRequest).
export interface RegisterRequest {
  login: string;
  email: string;
  nom: string;
  prenom: string;
  roles: string[];
}

export interface UtilisateurResponse {
  id: number;
  login: string;
  email: string;
  nom: string;
  prenom: string;
  actif: boolean;
  roles: string[];
}

// Renvoye lors de la verification d'un lien d'activation, avant d'afficher le formulaire
// de choix du mot de passe.
export interface InfoActivationResponse {
  prenom: string;
  email: string;
}

export interface ActivationRequest {
  token: string;
  motDePasse: string;
}
