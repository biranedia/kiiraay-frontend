import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Mouvement, MouvementRequest } from '../../../core/models/mouvement.model';

@Injectable({ providedIn: 'root' })
export class MouvementService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  listerParCellule(celluleId: number): Observable<Mouvement[]> {
    return this.http.get<Mouvement[]>(`${this.apiUrl}/cellules/${celluleId}/mouvements`);
  }

  creer(celluleId: number, request: MouvementRequest): Observable<Mouvement> {
    return this.http.post<Mouvement>(`${this.apiUrl}/cellules/${celluleId}/mouvements`, request);
  }

  trouverParId(id: number): Observable<Mouvement> {
    return this.http.get<Mouvement>(`${this.apiUrl}/mouvements/${id}`);
  }

  modifier(id: number, request: MouvementRequest): Observable<Mouvement> {
    return this.http.put<Mouvement>(`${this.apiUrl}/mouvements/${id}`, request);
  }

  cloturer(id: number): Observable<Mouvement> {
    return this.http.post<Mouvement>(`${this.apiUrl}/mouvements/${id}/cloturer`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/mouvements/${id}`);
  }
}
