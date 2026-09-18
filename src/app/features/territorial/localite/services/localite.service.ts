import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Localite, LocaliteRequest } from '../../../../core/models/territorial.model';

@Injectable({ providedIn: 'root' })
export class LocaliteService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/localites`;

  listerToutes(): Observable<Localite[]> {
    return this.http.get<Localite[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Localite> {
    return this.http.get<Localite>(`${this.baseUrl}/${id}`);
  }

  creer(request: LocaliteRequest): Observable<Localite> {
    return this.http.post<Localite>(this.baseUrl, request);
  }

  modifier(id: number, request: LocaliteRequest): Observable<Localite> {
    return this.http.put<Localite>(`${this.baseUrl}/${id}`, request);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
