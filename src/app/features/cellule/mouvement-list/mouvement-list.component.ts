import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Mouvement } from '../../../core/models/mouvement.model';
import { MouvementService } from '../services/mouvement.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-mouvement-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mouvement-list.component.html',
  styleUrl: './mouvement-list.component.scss'
})
export class MouvementListComponent {
  private readonly mouvementService = inject(MouvementService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly celluleId = Number(this.route.snapshot.paramMap.get('celluleId'));

  readonly mouvements = signal<Mouvement[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);
  readonly enAction = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  peutGerer(): boolean {
    return this.authService.possede('CELLULE_GERER');
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.mouvementService.listerParCellule(this.celluleId).subscribe({
      next: (mouvements) => {
        this.mouvements.set(mouvements);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les mouvements de cette cellule.');
        this.enChargement.set(false);
      }
    });
  }

  cloturer(mouvement: Mouvement): void {
    if (!confirm(`Cloturer le mouvement "${mouvement.categorie}" ?`)) {
      return;
    }
    this.enAction.set(mouvement.id);
    this.mouvementService.cloturer(mouvement.id).subscribe({
      next: () => { this.enAction.set(null); this.charger(); },
      error: () => { this.enAction.set(null); this.messageErreur.set('Impossible de cloturer ce mouvement.'); }
    });
  }

  supprimer(mouvement: Mouvement): void {
    if (!confirm(`Supprimer ce mouvement ?`)) {
      return;
    }
    this.mouvementService.supprimer(mouvement.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible pour ce mouvement.')
    });
  }
}
