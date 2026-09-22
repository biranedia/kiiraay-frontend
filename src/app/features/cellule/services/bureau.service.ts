import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { BureauCellule, FonctionBureau, FonctionBureauRequest } from '../../../core/models/bureau.model';

@Injectable({ providedIn: 'root' })
export class BureauService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  trouverParCellule(celluleId: number): Observable<BureauCellule> {
    return this.http.get<BureauCellule>(`${this.apiUrl}/cellules/${celluleId}/bureau`);
  }

  nommer(celluleId: number, request: FonctionBureauRequest): Observable<FonctionBureau> {
    return this.http.post<FonctionBureau>(`${this.apiUrl}/cellules/${celluleId}/bureau/fonctions`, request);
  }

  modifier(fonctionId: number, request: FonctionBureauRequest): Observable<FonctionBureau> {
    return this.http.put<FonctionBureau>(`${this.apiUrl}/fonctions/${fonctionId}`, request);
  }

  revoquer(fonctionId: number): Observable<FonctionBureau> {
    return this.http.post<FonctionBureau>(`${this.apiUrl}/fonctions/${fonctionId}/revoquer`, {});
  }

  supprimer(fonctionId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/fonctions/${fonctionId}`);
  }
}
