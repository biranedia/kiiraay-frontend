import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommuneVille } from '../../../../core/models/territorial.model';
import { CommuneVilleService } from '../services/commune-ville.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-commune-ville-list',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './commune-ville-list.component.html',
  styleUrl: './commune-ville-list.component.scss'
})
export class CommuneVilleListComponent {
  private readonly communeVilleService = inject(CommuneVilleService);
  private readonly authService = inject(AuthService);

  readonly communesVilles = signal<CommuneVille[]>([]);
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
    this.communeVilleService.listerToutes().subscribe({
      next: (items) => {
        this.communesVilles.set(items);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les communes/villes.');
        this.enChargement.set(false);
      }
    });
  }

  supprimer(item: CommuneVille): void {
    if (!confirm(`Supprimer "${item.nom}" ?`)) {
      return;
    }
    this.communeVilleService.supprimer(item.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible : cette commune/ville contient peut-etre des arrondissements.')
    });
  }
}
