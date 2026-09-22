import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AppShellComponent } from '../../core/layout/app-shell/app-shell.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  template: `
    <app-shell titre="Tableau de bord" sousTitre="Vue d'ensemble de la plateforme KIIRAAY">
      <div class="cartes">
        <div class="carte">
          <p class="carte-label">Connecte en tant que</p>
          <p class="carte-valeur">{{ authService.utilisateur()?.login }}</p>
        </div>
        <div class="carte">
          <p class="carte-label">Roles / permissions</p>
          <p class="carte-valeur carte-valeur--petit">{{ authService.utilisateur()?.autorites?.join(', ') }}</p>
        </div>
      </div>

      <p class="section-titre">Acces rapide</p>
      <nav class="raccourcis">
        @if (authService.possede('TERRITOIRE_GERER')) {
          <a routerLink="/territorial/departements">Departements</a>
          <a routerLink="/territorial/arrondissements">Arrondissements</a>
          <a routerLink="/territorial/communes-villes">Communes / Villes</a>
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
    </app-shell>
  `,
  styles: [`
    .cartes { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 28px; }
    .carte { background: #fff; border: 1px solid #e0e0e0; border-radius: 10px; padding: 16px 20px; min-width: 220px; }
    .carte-label { margin: 0 0 6px; font-size: 0.78rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .carte-valeur { margin: 0; font-size: 1.15rem; font-weight: 700; color: #16233f; }
    .carte-valeur--petit { font-size: 0.85rem; font-weight: 500; }
    .section-titre { font-size: 0.85rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .raccourcis { display: flex; gap: 12px; flex-wrap: wrap; }
    .raccourcis a {
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 10px 16px;
      color: #16233f;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88rem;
    }
    .raccourcis a:hover { border-color: #1f7a8c; color: #1f7a8c; }
  `]
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
}
