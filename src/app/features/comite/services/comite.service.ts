import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Comite, ComiteRequest } from '../../../core/models/comite.model';

@Injectable({ providedIn: 'root' })
export class ComiteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/comites`;

  listerTous(): Observable<Comite[]> {
    return this.http.get<Comite[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Comite> {
    return this.http.get<Comite>(`${this.baseUrl}/${id}`);
  }

  creer(request: ComiteRequest): Observable<Comite> {
    return this.http.post<Comite>(this.baseUrl, request);
  }

  modifier(id: number, request: ComiteRequest): Observable<Comite> {
    return this.http.put<Comite>(`${this.baseUrl}/${id}`, request);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
