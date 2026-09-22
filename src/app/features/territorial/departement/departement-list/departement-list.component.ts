import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Departement } from '../../../../core/models/territorial.model';
import { DepartementService } from '../services/departement.service';
import { AuthService } from '../../../../core/services/auth.service';

import { AppShellComponent } from '../../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-departement-list',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  templateUrl: './departement-list.component.html',
  styleUrl: './departement-list.component.scss'
})
export class DepartementListComponent {
  private readonly departementService = inject(DepartementService);
  private readonly authService = inject(AuthService);

  readonly departements = signal<Departement[]>([]);
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
    this.departementService.listerTous().subscribe({
      next: (departements) => {
        this.departements.set(departements);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les departements.');
        this.enChargement.set(false);
      }
    });
  }

  supprimer(departement: Departement): void {
    if (!confirm(`Supprimer le departement "${departement.nom}" ?`)) {
      return;
    }
    this.departementService.supprimer(departement.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible : le departement contient peut-etre des communes.')
    });
  }
}
