import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Localite } from '../../../../core/models/territorial.model';
import { LocaliteService } from '../services/localite.service';

@Component({
  selector: 'app-localite-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './localite-list.component.html',
  styleUrl: './localite-list.component.scss'
})
export class LocaliteListComponent {
  private readonly localiteService = inject(LocaliteService);

  readonly localites = signal<Localite[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);

  constructor() {
    this.charger();
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

  supprimer(item: Localite): void {
    if (!confirm(`Supprimer "${item.nom}" ?`)) {
      return;
    }
    this.localiteService.supprimer(item.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible pour cette localite.')
    });
  }
}
