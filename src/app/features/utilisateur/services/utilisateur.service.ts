import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ModifierRolesRequest, UtilisateurResponse } from '../../../core/models/auth.model';

// Gestion des comptes APRES leur creation (la creation elle-meme reste dans AuthService,
// via /api/auth/inscrire) : liste, roles, activation/desactivation. Tout est reserve a
// ADMIN_GENERAL cote backend (@PreAuthorize sur UtilisateurController).
@Injectable({ providedIn: 'root' })
export class UtilisateurService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/utilisateurs`;

  lister(): Observable<UtilisateurResponse[]> {
    return this.http.get<UtilisateurResponse[]>(this.base);
  }

  modifierRoles(id: number, request: ModifierRolesRequest): Observable<UtilisateurResponse> {
    return this.http.put<UtilisateurResponse>(`${this.base}/${id}/roles`, request);
  }

  desactiver(id: number): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(`${this.base}/${id}/desactiver`, {});
  }

  reactiver(id: number): Observable<UtilisateurResponse> {
    return this.http.post<UtilisateurResponse>(`${this.base}/${id}/reactiver`, {});
  }

  renvoyerActivation(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/renvoyer-activation`, {});
  }
}
