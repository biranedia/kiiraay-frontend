import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type TypeQr = 'cellules' | 'comites' | 'membres';

// Resultat du scan d'un QR code KIIRAAY (voir QrCodeService cote backend)
export interface QrResolution {
  type: 'CELLULE' | 'COMITE' | 'MEMBRE';
  id: number;
  code: string;
  libelle: string;
  statut: string;
  detail: string | null;
}

@Injectable({ providedIn: 'root' })
export class QrCodeService {
  private readonly http = inject(HttpClient);

  // Ouvre le QR code de l'objet dans un nouvel onglet (impression / partage)
  ouvrir(type: TypeQr, id: number): Observable<void> {
    return new Observable<void>((abonne) => {
      this.http.get(`${environment.apiUrl}/${type}/${id}/qrcode`, { responseType: 'blob' }).subscribe({
        next: (blob) => {
          window.open(window.URL.createObjectURL(blob), '_blank');
          abonne.next();
          abonne.complete();
        },
        error: (err) => abonne.error(err)
      });
    });
  }

  resoudre(valeur: string): Observable<QrResolution> {
    return this.http.get<QrResolution>(`${environment.apiUrl}/qrcode/resoudre`, {
      params: new HttpParams().set('valeur', valeur)
    });
  }
}
