import { ConfirmationService } from '../../../../core/services/confirmation.service';
import { TableauCartesDirective } from '../../../../shared/tableau-cartes.directive';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Localite } from '../../../../core/models/territorial.model';
import { LocaliteService } from '../services/localite.service';
import { AuthService } from '../../../../core/services/auth.service';

import { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-localite-list',
  standalone: true,
  imports: [TableauCartesDirective, RouterLink, AppShellComponent],
  templateUrl: './localite-list.component.html',
  styleUrl: './localite-list.component.scss'
})
export class LocaliteListComponent {
  private readonly localiteService = inject(LocaliteService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly authService = inject(AuthService);

  readonly localites = signal<Localite[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);

  constructor() {
    this.charger();
  }

  peutGerer(): boolean {
    return this.authService.possede('TERRITOIRE_GERER');
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.localiteService.listerToutes().subscribe({
      next: (items) => {
        this.localites.set(items);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les localites.');
        this.enChargement.set(false);
      }
    });
  }

  async supprimer(item: Localite): Promise<void> {
    if (!(await this.confirmation.demander(`Supprimer "${item.nom}" ?`))) {
      return;
    }
    this.localiteService.supprimer(item.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible pour cette localite.')
    });
  }
}
