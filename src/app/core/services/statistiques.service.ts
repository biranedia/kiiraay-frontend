import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  StatistiquesArrondissement,
  StatistiquesCommune,
  StatistiquesDepartementales,
  StatistiquesLocalite
} from '../models/statistiques.model';

@Injectable({ providedIn: 'root' })
export class StatistiquesService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/statistiques`;

  vueDepartementale(): Observable<StatistiquesDepartementales> {
    return this.http.get<StatistiquesDepartementales>(`${this.baseUrl}/departemental`);
  }

  vueParCommunes(): Observable<StatistiquesCommune[]> {
    return this.http.get<StatistiquesCommune[]>(`${this.baseUrl}/communes`);
  }

  vueParArrondissements(): Observable<StatistiquesArrondissement[]> {
    return this.http.get<StatistiquesArrondissement[]>(`${this.baseUrl}/arrondissements`);
  }

  vueParLocalites(): Observable<StatistiquesLocalite[]> {
    return this.http.get<StatistiquesLocalite[]>(`${this.baseUrl}/localites`);
  }
}
