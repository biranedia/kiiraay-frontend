import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EntreeJournal, FiltresJournal, PageResponse } from '../../core/models/journal.model';

@Injectable({ providedIn: 'root' })
export class JournalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/journal`;

  rechercher(filtres: FiltresJournal, page: number, taille: number): Observable<PageResponse<EntreeJournal>> {
    let params = new HttpParams().set('page', page).set('taille', taille);
    Object.entries(filtres).forEach(([cle, valeur]) => {
      if (valeur) {
        params = params.set(cle, valeur);
      }
    });
    return this.http.get<PageResponse<EntreeJournal>>(this.base, { params });
  }

  listerActions(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/actions`);
  }
}
