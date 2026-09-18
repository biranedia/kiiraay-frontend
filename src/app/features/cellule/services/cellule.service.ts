import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Cellule, CelluleRequest } from '../../../core/models/cellule.model';

@Injectable({ providedIn: 'root' })
export class CelluleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/cellules`;

  listerToutes(): Observable<Cellule[]> {
    return this.http.get<Cellule[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Cellule> {
    return this.http.get<Cellule>(`${this.baseUrl}/${id}`);
  }

  creer(request: CelluleRequest): Observable<Cellule> {
    return this.http.post<Cellule>(this.baseUrl, request);
  }

  modifier(id: number, request: CelluleRequest): Observable<Cellule> {
    return this.http.put<Cellule>(`${this.baseUrl}/${id}`, request);
  }

  soumettre(id: number): Observable<Cellule> {
    return this.http.post<Cellule>(`${this.baseUrl}/${id}/soumettre`, {});
  }

  valider(id: number): Observable<Cellule> {
    return this.http.post<Cellule>(`${this.baseUrl}/${id}/valider`, {});
  }

  rejeter(id: number): Observable<Cellule> {
    return this.http.post<Cellule>(`${this.baseUrl}/${id}/rejeter`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
