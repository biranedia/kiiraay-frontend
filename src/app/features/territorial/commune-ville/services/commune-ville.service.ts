import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CommuneVille, CommuneVilleRequest } from '../../../../core/models/territorial.model';

@Injectable({ providedIn: 'root' })
export class CommuneVilleService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/communes-villes`;

  listerToutes(): Observable<CommuneVille[]> {
    return this.http.get<CommuneVille[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<CommuneVille> {
    return this.http.get<CommuneVille>(`${this.baseUrl}/${id}`);
  }

  creer(request: CommuneVilleRequest): Observable<CommuneVille> {
    return this.http.post<CommuneVille>(this.baseUrl, request);
  }

  modifier(id: number, request: CommuneVilleRequest): Observable<CommuneVille> {
    return this.http.put<CommuneVille>(`${this.baseUrl}/${id}`, request);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
