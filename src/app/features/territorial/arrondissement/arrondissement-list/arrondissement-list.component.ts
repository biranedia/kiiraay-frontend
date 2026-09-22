import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Arrondissement } from '../../../../core/models/territorial.model';
import { ArrondissementService } from '../services/arrondissement.service';
import { AuthService } from '../../../../core/services/auth.service';

import { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-arrondissement-list',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  templateUrl: './arrondissement-list.component.html',
  styleUrl: './arrondissement-list.component.scss'
})
export class ArrondissementListComponent {
  private readonly arrondissementService = inject(ArrondissementService);
  private readonly authService = inject(AuthService);

  readonly arrondissements = signal<Arrondissement[]>([]);
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
    this.arrondissementService.listerTous().subscribe({
      next: (items) => {
        this.arrondissements.set(items);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les arrondissements.');
        this.enChargement.set(false);
      }
    });
  }

  supprimer(item: Arrondissement): void {
    if (!confirm(`Supprimer "${item.nom}" ?`)) {
      return;
    }
    this.arrondissementService.supprimer(item.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible : cet arrondissement contient peut-etre des localites.')
    });
  }
}
