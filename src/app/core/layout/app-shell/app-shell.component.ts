import { Component, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

interface LienNav {
  libelle: string;
  route: string;
  icone: string;
  autoriteRequise?: string;
}

interface SectionNav {
  titre: string;
  liens: LienNav[];
}

// Icones au trait, simples et coherentes (24x24, stroke uniquement) : evite toute dependance
// a une librairie d'icones externe.
const ICONES: Record<string, string> = {
  dashboard: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z',
  territoire: 'M12 2 3 7v2h18V7l-9-5ZM4 20h16v-2H4v2Zm2-9v6h3v-6H6Zm5 0v6h2v-6h-2Zm4 0v6h3v-6h-3Z',
  cellule: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z',
  comite: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20v-2c0-2.2 2.7-4 6-4s6 1.8 6 4v2H2Zm12-4c2.5.4 4 1.8 4 4v2h4v-2c0-2-2.3-3.6-4-4Z',
  membre: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z',
  utilisateur: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Zm7-9 1.5 1.5L17 9l3 3-1.5 1.5L15 10l3-3-1.5-1.5L19 5Z'
};

const SECTIONS: SectionNav[] = [
  {
    titre: '',
    liens: [{ libelle: 'Tableau de bord', route: '/tableau-de-bord', icone: 'dashboard' }]
  },
  {
    titre: 'Territoire',
    liens: [
      { libelle: 'Departements', route: '/territorial/departements', icone: 'territoire', autoriteRequise: 'TERRITOIRE_GERER' },
      { libelle: 'Arrondissements', route: '/territorial/arrondissements', icone: 'territoire', autoriteRequise: 'TERRITOIRE_GERER' },
      { libelle: 'Communes / Villes', route: '/territorial/communes-villes', icone: 'territoire', autoriteRequise: 'TERRITOIRE_GERER' },
      { libelle: 'Localites', route: '/territorial/localites', icone: 'territoire', autoriteRequise: 'TERRITOIRE_GERER' }
    ]
  },
  {
    titre: 'Organisation',
    liens: [
      { libelle: 'Cellules', route: '/cellule/cellules', icone: 'cellule', autoriteRequise: 'CELLULE_GERER' },
      { libelle: 'Responsables', route: '/comite/responsables', icone: 'comite', autoriteRequise: 'COMITE_GERER' },
      { libelle: 'Comites', route: '/comite/comites', icone: 'comite', autoriteRequise: 'COMITE_GERER' }
    ]
  },
  {
    titre: 'Membres & acces',
    liens: [
      { libelle: 'Membres', route: '/membre/membres', icone: 'membre', autoriteRequise: 'MEMBRE_LIRE' },
      { libelle: 'Nouvel utilisateur', route: '/utilisateurs/nouveau', icone: 'utilisateur', autoriteRequise: 'ADMIN_GENERAL' }
    ]
  }
];

// Coquille commune a toutes les pages authentifiees : sidebar de navigation + en-tete de
// page. Chaque page fournit son titre/sous-titre et, optionnellement, un bouton d'action
// via le slot [actions].
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss'
})
export class AppShellComponent {
  private readonly authService = inject(AuthService);

  @Input() titre = '';
  @Input() sousTitre = '';

  readonly ICONES = ICONES;

  get sectionsVisibles(): SectionNav[] {
    return SECTIONS
      .map((section) => ({
        ...section,
        liens: section.liens.filter((l) => !l.autoriteRequise || this.authService.possede(l.autoriteRequise))
      }))
      .filter((section) => section.liens.length > 0);
  }

  get utilisateurConnecte() {
    return this.authService.utilisateur();
  }

  deconnecter(): void {
    this.authService.deconnecter();
  }
}
