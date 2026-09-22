import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  ActivationRequest,
  AuthResponse,
  InfoActivationResponse,
  LoginRequest,
  RegisterRequest,
  UtilisateurConnecte,
  UtilisateurResponse
} from '../models/auth.model';

const CLE_ACCESS_TOKEN = 'kiiraay_access_token';
const CLE_REFRESH_TOKEN = 'kiiraay_refresh_token';

// Service central de l'authentification : login, logout, gestion des tokens (localStorage),
// et etat reactif (signals) de l'utilisateur connecte, lu par toute l'application (guards, menus...).
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  // Signal prive : source de verite. Initialise depuis le token deja present (si l'utilisateur
  // recharge la page, on ne doit pas le deconnecter).
  private readonly utilisateurSignal = signal<UtilisateurConnecte | null>(this.lireUtilisateurDepuisToken());

  // Signal public en lecture seule : les composants ne peuvent pas le modifier directement
  readonly utilisateur = this.utilisateurSignal.asReadonly();
  readonly estConnecte = computed(() => this.utilisateurSignal() !== null);

  connecter(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, request).pipe(
      tap((reponse) => this.stockerSession(reponse))
    );
  }

  rafraichirToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthResponse>(`${environment.apiUrl}/auth/refresh`, { refreshToken }).pipe(
      tap((reponse) => this.stockerSession(reponse))
    );
  }

  deconnecter(): void {
    localStorage.removeItem(CLE_ACCESS_TOKEN);
    localStorage.removeItem(CLE_REFRESH_TOKEN);
    this.utilisateurSignal.set(null);
    this.router.navigate(['/connexion']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(CLE_ACCESS_TOKEN);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(CLE_REFRESH_TOKEN);
  }

  // Verifie si l'utilisateur possede un role (ex: "ADMIN_GENERAL") ou une permission (ex: "MEMBRE_LIRE")
  possede(autorite: string): boolean {
    const utilisateur = this.utilisateurSignal();
    if (!utilisateur) return false;
    return utilisateur.autorites.includes(autorite) || utilisateur.autorites.includes('ROLE_' + autorite);
  }

  // --- Creation de compte par un administrateur + activation par l'utilisateur lui-meme ---
  // Aucun mot de passe n'est jamais choisi ou vu par l'administrateur (voir AuthService cote
  // backend) : l'utilisateur le definit lui-meme via le lien recu par email.

  inscrire(request: RegisterRequest): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(`${environment.apiUrl}/auth/inscrire`, request);
  }

  verifierActivation(token: string): Observable<InfoActivationResponse> {
    return this.http.get<InfoActivationResponse>(`${environment.apiUrl}/auth/activation/${token}`);
  }

  activerCompte(request: ActivationRequest): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/auth/activer-compte`, request);
  }

  private stockerSession(reponse: AuthResponse): void {
    localStorage.setItem(CLE_ACCESS_TOKEN, reponse.accessToken);
    localStorage.setItem(CLE_REFRESH_TOKEN, reponse.refreshToken);
    this.utilisateurSignal.set(this.decoderToken(reponse.accessToken));
  }

  private lireUtilisateurDepuisToken(): UtilisateurConnecte | null {
    const token = this.getAccessToken();
    if (!token) return null;

    const utilisateur = this.decoderToken(token);
    // Si le token stocke est deja expire, on ne restaure pas la session (l'utilisateur devra
    // se reconnecter ; un refresh automatique pourra etre ajoute plus tard si besoin).
    if (utilisateur && this.estExpire(token)) {
      return null;
    }
    return utilisateur;
  }

  // Decode la partie "payload" d'un JWT (base64url) SANS verifier la signature :
  // ce n'est pas un controle de securite (le backend, lui, verifie toujours la signature),
  // juste un moyen d'afficher le login/les roles cote client sans appel API supplementaire.
  private decoderToken(token: string): UtilisateurConnecte | null {
    try {
      const partiePayload = token.split('.')[1];
      const jsonDecode = atob(partiePayload.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(jsonDecode);
      return { login: payload.sub, autorites: payload.autorites ?? [] };
    } catch {
      return null;
    }
  }

  private estExpire(token: string): boolean {
    try {
      const partiePayload = token.split('.')[1];
      const payload = JSON.parse(atob(partiePayload.replace(/-/g, '+').replace(/_/g, '/')));
      return payload.exp * 1000 < Date.now();
    } catch {
      return true;
    }
  }
}
