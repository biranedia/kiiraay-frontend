import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cellule } from '../../../core/models/cellule.model';
import { CelluleService } from '../services/cellule.service';

@Component({
  selector: 'app-cellule-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './cellule-list.component.html',
  styleUrl: './cellule-list.component.scss'
})
export class CelluleListComponent {
  private readonly celluleService = inject(CelluleService);

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

  peutSoumettre(cellule: Cellule): boolean {
    return cellule.statut === 'BROUILLON' || cellule.statut === 'EN_CONSTITUTION';
  }

  peutValiderOuRejeter(cellule: Cellule): boolean {
    return cellule.statut === 'EN_ATTENTE';
  }

  peutModifier(cellule: Cellule): boolean {
    return cellule.statut !== 'VALIDEE' && cellule.statut !== 'SUSPENDUE' && cellule.statut !== 'INACTIVE';
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
