import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatistiquesDepartementales } from '../models/statistiques.model';

@Injectable({ providedIn: 'root' })
export class StatistiquesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/statistiques`;

  vueDepartementale(): Observable<StatistiquesDepartementales> {
    return this.http.get<StatistiquesDepartementales>(`${this.baseUrl}/departemental`);
  }
}
