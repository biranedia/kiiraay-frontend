import { Injectable, signal } from '@angular/core';

export interface DemandeConfirmation {
  message: string;
  libelleBouton: string;
  danger: boolean;
  resoudre: (reponse: boolean) => void;
}

// Confirmation centralisee, remplace window.confirm() (boite native peu lisible, bloquante et
// incoherente avec l'interface, surtout sur mobile). Usage :
//   if (!(await this.confirmation.demander('Supprimer ... ?'))) { return; }
@Injectable({ providedIn: 'root' })
export class ConfirmationService {
  readonly demande = signal<DemandeConfirmation | null>(null);

  demander(message: string, libelleBouton?: string, danger?: boolean): Promise<boolean> {
    // Libelle et style deduits du verbe d'action si non precises (Supprimer, Rejeter...)
    const verbe = message.split(' ')[0];
    const destructif = ['Supprimer', 'Rejeter', 'Revoquer'].includes(verbe);
    return new Promise<boolean>((resoudre) => {
      this.demande()?.resoudre(false); // une seule demande a la fois
      this.demande.set({
        message,
        libelleBouton: libelleBouton ?? (/^[A-Z][a-z]+er$/.test(verbe) ? verbe : 'Confirmer'),
        danger: danger ?? destructif,
        resoudre
      });
    });
  }

  repondre(reponse: boolean): void {
    const demande = this.demande();
    this.demande.set(null);
    demande?.resoudre(reponse);
  }
}
