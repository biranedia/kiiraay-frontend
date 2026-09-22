export type Sexe = 'M' | 'F';

export type StatutMembre = 'BROUILLON' | 'EN_ATTENTE' | 'VALIDE' | 'NON_VALIDE' | 'SUSPENDU';

export interface Membre {
  id: number;
  identifiantUnique: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  sexe: Sexe;
  telephone: string | null;
  comiteCode: string;
  statut: StatutMembre;
  numeroCNI: string | null;
  numeroCarteElecteur: string | null;
  doublonPotentielDetecte: boolean;
  alertesDoublon: string[];
  // Indique seulement si une photo de la CNI a ete televersee (jamais le contenu ni le
  // chemin) : permet d'expliquer pourquoi la validation est bloquee tant que les deux
  // manquent. La carte d'electeur ne necessite pas de photo (numero seul suffisant).
  photoRectoPresente: boolean;
  photoVersoPresente: boolean;
  // Photo de profil (portrait) : donnee non sensible, visible par quiconque a MEMBRE_LIRE.
  photoProfilPresente: boolean;
}

export interface MembreRequest {
  nom: string;
  prenom: string;
  dateNaissance: string;
  lieuNaissance?: string;
  sexe: Sexe;
  telephone?: string;
  email?: string;
  adresse?: string;
  comiteId: number;
  numeroCNI: string;
  dateDelivranceCNI?: string;
  dateExpirationCNI?: string;
  lieuDelivranceCNI?: string;
  numeroCarteElecteur?: string;
}

// Criteres optionnels de recherche multi-criteres (section 12 du cahier des charges) :
// tous les champs sont facultatifs et combinables.
export interface MembreCritereRecherche {
  nom?: string;
  prenom?: string;
  telephone?: string;
  numeroCNI?: string;
  numeroCarteElecteur?: string;
  statut?: StatutMembre;
  comiteId?: number;
}
