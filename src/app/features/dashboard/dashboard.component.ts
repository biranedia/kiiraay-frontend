import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div style="padding: 2rem;">
      <h1>Tableau de bord</h1>
      <p>Connecte en tant que : <strong>{{ authService.utilisateur()?.login }}</strong></p>
      <p>Roles / permissions : {{ authService.utilisateur()?.autorites?.join(', ') }}</p>

      <nav style="margin: 1.5rem 0; display: flex; gap: 16px; flex-wrap: wrap;">
        @if (authService.possede('TERRITOIRE_GERER')) {
          <a routerLink="/territorial/regions">Regions</a>
          <a routerLink="/territorial/departements">Departements</a>
          <a routerLink="/territorial/communes-villes">Communes / Villes</a>
          <a routerLink="/territorial/arrondissements">Arrondissements</a>
          <a routerLink="/territorial/localites">Localites</a>
        }
        @if (authService.possede('CELLULE_GERER')) {
          <a routerLink="/cellule/cellules">Cellules</a>
        }
        @if (authService.possede('COMITE_GERER')) {
          <a routerLink="/comite/responsables">Responsables</a>
          <a routerLink="/comite/comites">Comites</a>
        }
        @if (authService.possede('MEMBRE_LIRE')) {
          <a routerLink="/membre/membres">Membres</a>
        }
        @if (authService.possede('ADMIN_GENERAL')) {
          <a routerLink="/utilisateurs/nouveau">Nouvel utilisateur</a>
        }
      </nav>

      <button (click)="authService.deconnecter()">Se deconnecter</button>
    </div>
  `
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
}
