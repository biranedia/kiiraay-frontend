import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Responsable, ResponsableRequest } from '../../../core/models/comite.model';

@Injectable({ providedIn: 'root' })
export class ResponsableService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/responsables`;

  listerTous(): Observable<Responsable[]> {
    return this.http.get<Responsable[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Responsable> {
    return this.http.get<Responsable>(`${this.baseUrl}/${id}`);
  }

  creer(request: ResponsableRequest): Observable<Responsable> {
    return this.http.post<Responsable>(this.baseUrl, request);
  }

  modifier(id: number, request: ResponsableRequest): Observable<Responsable> {
    return this.http.put<Responsable>(`${this.baseUrl}/${id}`, request);
  }
}
