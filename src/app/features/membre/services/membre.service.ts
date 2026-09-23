import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { HttpParams } from '@angular/common/http';
import { ImportMembresResponse, Membre, MembreCritereRecherche, MembreRequest } from '../../../core/models/membre.model';

@Injectable({ providedIn: 'root' })
export class MembreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/membres`;

  listerTous(): Observable<Membre[]> {
    return this.http.get<Membre[]>(this.baseUrl);
  }

  // Recherche multi-criteres (section 12 du cahier des charges). Les champs non renseignes
  // sont simplement omis de la requete (le backend les ignore alors).
  rechercher(criteres: MembreCritereRecherche): Observable<Membre[]> {
    return this.http.get<Membre[]>(`${this.baseUrl}/recherche`, { params: this.versParametres(criteres) });
  }

  // Export CSV des membres correspondant aux memes criteres que rechercher(). Le blob est
  // ensuite transforme en telechargement par l'appelant (voir MembreListComponent).
  exporterCsv(criteres: MembreCritereRecherche): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export`, { params: this.versParametres(criteres), responseType: 'blob' });
  }

  // Export Excel (.xlsx), mêmes criteres et memes colonnes que exporterCsv() : plus pratique
  // pour une ouverture directe dans Excel (pas de souci d'encodage/separateur).
  exporterExcel(criteres: MembreCritereRecherche): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/export-excel`, { params: this.versParametres(criteres), responseType: 'blob' });
  }

  // Import en masse depuis un fichier .csv ou .xlsx (voir ImportMembresResponse cote backend
  // pour le detail des colonnes attendues). Le resultat rapporte, ligne par ligne, les succes
  // et les echecs (doublons, comite introuvable, champs invalides...) sans jamais tout rejeter
  // pour une seule ligne en erreur.
  importer(fichier: File): Observable<ImportMembresResponse> {
    const donnees = new FormData();
    donnees.append('fichier', fichier);
    return this.http.post<ImportMembresResponse>(`${this.baseUrl}/import`, donnees);
  }

  private versParametres(criteres: MembreCritereRecherche): HttpParams {
    let parametres = new HttpParams();
    Object.entries(criteres).forEach(([cle, valeur]) => {
      if (valeur !== undefined && valeur !== null && valeur !== '') {
        parametres = parametres.set(cle, String(valeur));
      }
    });
    return parametres;
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
