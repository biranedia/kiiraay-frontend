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
    .cartes { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 32px; }
    .carte {
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 12px;
      padding: 18px 22px;
      min-width: 220px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06);
    }
    .carte-label { margin: 0 0 8px; font-size: 0.72rem; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; }
    .carte-valeur { margin: 0; font-size: 1.2rem; font-weight: 700; color: #16233f; }
    .carte-valeur--petit { font-size: 0.85rem; font-weight: 500; line-height: 1.5; }
    .section-titre { font-size: 0.72rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 14px; }
    .raccourcis { display: flex; gap: 12px; flex-wrap: wrap; }
    .raccourcis a {
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 10px;
      padding: 12px 18px;
      color: #16233f;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
      transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
    }
    .raccourcis a:hover {
      border-color: #1f7a8c;
      color: #1f7a8c;
      box-shadow: 0 4px 10px rgba(16, 24, 40, 0.08);
      transform: translateY(-1px);
    }
  `]
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
}
