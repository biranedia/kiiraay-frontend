import { QrCodeService } from '../../../core/services/qrcode.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { TableauCartesDirective } from '../../../shared/tableau-cartes.directive';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Comite } from '../../../core/models/comite.model';
import { ComiteService } from '../services/comite.service';
import { AuthService } from '../../../core/services/auth.service';

import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-comite-list',
  standalone: true,
  imports: [TableauCartesDirective, RouterLink, AppShellComponent],
  templateUrl: './comite-list.component.html',
  styleUrl: './comite-list.component.scss'
})
export class ComiteListComponent {
  private readonly comiteService = inject(ComiteService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly qrCodeService = inject(QrCodeService);
  private readonly authService = inject(AuthService);

  readonly comites = signal<Comite[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);

  constructor() {
    this.charger();
  }

  peutGerer(): boolean {
    return this.authService.possede('COMITE_GERER');
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.comiteService.listerTous().subscribe({
      next: (comites) => {
        this.comites.set(comites);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les comites.');
        this.enChargement.set(false);
      }
    });
  }

  async supprimer(comite: Comite): Promise<void> {
    if (!(await this.confirmation.demander(`Supprimer le comite "${comite.code}" ?`))) {
      return;
    }
    this.comiteService.supprimer(comite.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible pour ce comite.')
    });
  }

  afficherQrCode(id: number): void {
    this.qrCodeService.ouvrir('comites', id).subscribe({
      error: () => this.messageErreur.set('Impossible de generer le QR code.')
    });
  }
}
