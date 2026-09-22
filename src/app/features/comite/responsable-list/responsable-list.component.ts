import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Responsable } from '../../../core/models/comite.model';
import { ResponsableService } from '../services/responsable.service';
import { AuthService } from '../../../core/services/auth.service';

import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-responsable-list',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  templateUrl: './responsable-list.component.html',
  styleUrl: './responsable-list.component.scss'
})
export class ResponsableListComponent {
  private readonly responsableService = inject(ResponsableService);
  private readonly authService = inject(AuthService);

  readonly responsables = signal<Responsable[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);

  constructor() {
    this.responsableService.listerTous().subscribe({
      next: (responsables) => {
        this.responsables.set(responsables);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les responsables.');
        this.enChargement.set(false);
      }
    });
  }

  peutGerer(): boolean {
    return this.authService.possede('COMITE_GERER');
  }
}
