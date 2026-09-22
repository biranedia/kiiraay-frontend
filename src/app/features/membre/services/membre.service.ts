import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Membre, MembreRequest } from '../../../core/models/membre.model';

@Injectable({ providedIn: 'root' })
export class MembreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/membres`;

  listerTous(): Observable<Membre[]> {
    return this.http.get<Membre[]>(this.baseUrl);
  }

  trouverParId(id: number): Observable<Membre> {
    return this.http.get<Membre>(`${this.baseUrl}/${id}`);
  }

  creer(request: MembreRequest): Observable<Membre> {
    return this.http.post<Membre>(this.baseUrl, request);
  }

  modifier(id: number, request: MembreRequest): Observable<Membre> {
    return this.http.put<Membre>(`${this.baseUrl}/${id}`, request);
  }

  soumettre(id: number): Observable<Membre> {
    return this.http.post<Membre>(`${this.baseUrl}/${id}/soumettre`, {});
  }

  valider(id: number): Observable<Membre> {
    return this.http.post<Membre>(`${this.baseUrl}/${id}/valider`, {});
  }

  rejeter(id: number): Observable<Membre> {
    return this.http.post<Membre>(`${this.baseUrl}/${id}/rejeter`, {});
  }

  supprimer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Televersement des photos recto/verso de la CNI (preuve visuelle exigee avant
  // validation). L'un des deux fichiers peut etre omis si on ne remplace qu'un cote.
  televerserPhotos(id: number, recto: File | null, verso: File | null): Observable<Membre> {
    const donnees = new FormData();
    if (recto) {
      donnees.append('recto', recto);
    }
    if (verso) {
      donnees.append('verso', verso);
    }
    return this.http.post<Membre>(`${this.baseUrl}/${id}/piece-identite/photos`, donnees);
  }

  // Recupere une photo de CNI deja televersee (recto ou verso) pour affichage. L'intercepteur
  // ajoute automatiquement le token ; le blob est ensuite transforme en URL locale par l'appelant.
  recupererPhotoCni(id: number, cote: 'recto' | 'verso'): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/piece-identite/photos/${cote}`, { responseType: 'blob' });
  }

  // Photo de profil (portrait) : donnee non sensible, distincte de la CNI.
  televerserPhotoProfil(id: number, photo: File): Observable<Membre> {
    const donnees = new FormData();
    donnees.append('photo', photo);
    return this.http.post<Membre>(`${this.baseUrl}/${id}/photo-profil`, donnees);
  }

  recupererPhotoProfil(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/photo-profil`, { responseType: 'blob' });
  }
}
