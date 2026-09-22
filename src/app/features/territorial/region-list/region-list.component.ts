import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Region } from '../../../core/models/region.model';
import { RegionService } from '../services/region.service';
import { AuthService } from '../../../core/services/auth.service';

import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-region-list',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  templateUrl: './region-list.component.html',
  styleUrl: './region-list.component.scss'
})
export class RegionListComponent {
  private readonly regionService = inject(RegionService);
  private readonly authService = inject(AuthService);

  readonly regions = signal<Region[]>([]);
  readonly enChargement = signal<boolean>(true);
  readonly messageErreur = signal<string | null>(null);

  constructor() {
    this.chargerRegions();
  }

  peutGerer(): boolean {
    return this.authService.possede('TERRITOIRE_GERER');
  }

  chargerRegions(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.regionService.listerToutes().subscribe({
      next: (regions) => {
        this.regions.set(regions);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les regions.');
        this.enChargement.set(false);
      }
    });
  }

  supprimer(region: Region): void {
    const confirmation = confirm(`Supprimer la region "${region.nom}" ? Cette action est irreversible.`);
    if (!confirmation) {
      return;
    }
    this.regionService.supprimer(region.id).subscribe({
      next: () => this.chargerRegions(),
      error: () => this.messageErreur.set('Suppression impossible : la region contient peut-etre des departements.')
    });
  }
}
