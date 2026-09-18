import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Region, RegionRequest } from '../../../core/models/region.model';

@Injectable({ providedIn: 'root' })
export class RegionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/regions`;

  listerToutes(): Observable<Region[]> {
    return this.http.get<Region[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Region> {
    return this.http.get<Region>(`${this.baseUrl}/${id}`);
  }

  creer(request: RegionRequest): Observable<Region> {
    return this.http.post<Region>(this.baseUrl, request);
  }

  modifier(id: number, request: RegionRequest): Observable<Region> {
    return this.http.put<Region>(`${this.baseUrl}/${id}`, request);
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
