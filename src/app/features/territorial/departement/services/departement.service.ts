import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { Departement, DepartementRequest } from '../../../../core/models/territorial.model';

@Injectable({ providedIn: 'root' })
export class DepartementService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/departements`;

  listerTous(): Observable<Departement[]> {
    return this.http.get<Departement[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Departement> {
    return this.http.get<Departement>(`${this.baseUrl}/${id}`);
  }

  creer(request: DepartementRequest): Observable<Departement> {
    return this.http.post<Departement>(this.baseUrl, request);
  }

  modifier(id: number, request: DepartementRequest): Observable<Departement> {
    return this.http.put<Departement>(`${this.baseUrl}/${id}`, request);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
