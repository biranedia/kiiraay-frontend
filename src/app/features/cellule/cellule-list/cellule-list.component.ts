import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cellule } from '../../../core/models/cellule.model';
import { CelluleService } from '../services/cellule.service';
import { AuthService } from '../../../core/services/auth.service';

import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-cellule-list',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  templateUrl: './cellule-list.component.html',
  styleUrl: './cellule-list.component.scss'
})
export class CelluleListComponent {
  private readonly celluleService = inject(CelluleService);
  private readonly authService = inject(AuthService);

  readonly cellules = signal<Cellule[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);
  readonly enAction = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.celluleService.listerToutes().subscribe({
      next: (cellules) => {
        this.cellules.set(cellules);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les cellules.');
        this.enChargement.set(false);
      }
    });
  }

  // Droit general de gestion des cellules (creer/modifier/soumettre/supprimer)
  peutGerer(): boolean {
    return this.authService.possede('CELLULE_GERER');
  }

  // Droit specifique de validation (distinct de la gestion : un RESPONSABLE_CELLULE
  // peut gerer ses cellules mais ne doit pas pouvoir les valider lui-meme)
  peutValider(): boolean {
    return this.authService.possede('CELLULE_VALIDER');
  }

  peutSoumettre(cellule: Cellule): boolean {
    return this.peutGerer() && (cellule.statut === 'BROUILLON' || cellule.statut === 'EN_CONSTITUTION');
  }

  peutValiderOuRejeter(cellule: Cellule): boolean {
    return this.peutValider() && cellule.statut === 'EN_ATTENTE';
  }

  peutModifier(cellule: Cellule): boolean {
    return this.peutGerer()
      && cellule.statut !== 'VALIDEE' && cellule.statut !== 'SUSPENDUE' && cellule.statut !== 'INACTIVE';
  }

  soumettre(cellule: Cellule): void {
    this.enAction.set(cellule.id);
    this.celluleService.soumettre(cellule.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de soumettre cette cellule.');
      }
    });
  }

  valider(cellule: Cellule): void {
    this.enAction.set(cellule.id);
    this.celluleService.valider(cellule.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de valider cette cellule.');
      }
    });
  }

  rejeter(cellule: Cellule): void {
    if (!confirm(`Rejeter la cellule "${cellule.nom}" ?`)) {
      return;
    }
    this.enAction.set(cellule.id);
    this.celluleService.rejeter(cellule.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de rejeter cette cellule.');
      }
    });
  }

  supprimer(cellule: Cellule): void {
    if (!confirm(`Supprimer la cellule "${cellule.nom}" ?`)) {
      return;
    }
    this.celluleService.supprimer(cellule.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible pour cette cellule.')
    });
  }
}
