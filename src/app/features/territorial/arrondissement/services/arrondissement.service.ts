import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Arrondissement, ArrondissementRequest } from '../../../../core/models/territorial.model';

@Injectable({ providedIn: 'root' })
export class ArrondissementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/arrondissements`;

  listerTous(): Observable<Arrondissement[]> {
    return this.http.get<Arrondissement[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Arrondissement> {
    return this.http.get<Arrondissement>(`${this.baseUrl}/${id}`);
  }

  creer(request: ArrondissementRequest): Observable<Arrondissement> {
    return this.http.post<Arrondissement>(this.baseUrl, request);
  }

  modifier(id: number, request: ArrondissementRequest): Observable<Arrondissement> {
    return this.http.put<Arrondissement>(`${this.baseUrl}/${id}`, request);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
