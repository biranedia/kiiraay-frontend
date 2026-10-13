import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { InstallationPwaService } from '../../services/installation-pwa.service';
import { NotificationAlerte } from '../../models/notification.model';

interface LienNav {
  libelle: string;
  route: string;
  icone: string;
  // Une autorite, ou une liste dont UNE seule suffit
  autoriteRequise?: string | string[];
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
  qrcode: 'M3 3h8v8H3V3Zm2 2v4h4V5H5Zm8-2h8v8h-8V3Zm2 2v4h4V5h-4ZM3 13h8v8H3v-8Zm2 2v4h4v-4H5Zm8-2h2v2h-2v-2Zm4 0h4v2h-4v-2Zm-4 4h2v4h-2v-4Zm4 2h2v2h-2v-2Zm2-2h2v2h-2v-2Zm0 4h2v2h-2v-2Z',
  journal: 'M6 2h9l5 5v15H6V2Zm8 1.5V8h4.5L14 3.5ZM8 11h8v1.5H8V11Zm0 4h8v1.5H8V15Zm0 4h5v1.5H8V19Z',
  utilisateur: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Zm7-9 1.5 1.5L17 9l3 3-1.5 1.5L15 10l3-3-1.5-1.5L19 5Z'
};

const SECTIONS: SectionNav[] = [
  {
    titre: '',
    liens: [
      { libelle: 'Tableau de bord', route: '/tableau-de-bord', icone: 'dashboard' },
      { libelle: 'Scanner un QR code', route: '/scanner', icone: 'qrcode' }
    ]
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
      // Le validateur doit aussi y acceder pour valider/rejeter les cellules
      { libelle: 'Cellules', route: '/cellule/cellules', icone: 'cellule', autoriteRequise: ['CELLULE_GERER', 'CELLULE_VALIDER'] },
      { libelle: 'Responsables', route: '/comite/responsables', icone: 'comite', autoriteRequise: 'COMITE_GERER' },
      { libelle: 'Comites', route: '/comite/comites', icone: 'comite', autoriteRequise: 'COMITE_GERER' }
    ]
  },
  {
    titre: 'Membres',
    liens: [{ libelle: 'Membres', route: '/membre/membres', icone: 'membre', autoriteRequise: 'MEMBRE_LIRE' }]
  },
  {
    titre: 'Administration',
    liens: [
      { libelle: 'Utilisateurs', route: '/utilisateurs', icone: 'utilisateur', autoriteRequise: 'ADMIN_GENERAL' },
      { libelle: "Journal d'activite", route: '/journal', icone: 'journal', autoriteRequise: 'ADMIN_GENERAL' }
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
export class AppShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  protected readonly installation = inject(InstallationPwaService);
  private readonly notificationService = inject(NotificationService);

  @Input() titre = '';
  @Input() sousTitre = '';

  readonly ICONES = ICONES;

  // Cloche de notifications (section 17 du cahier des charges) : chargee une fois a
  // l'ouverture de n'importe quelle page (la coquille est partagee par toutes), rafraichie
  // a chaque ouverture du panneau pour rester a jour sans avoir besoin de polling continu.
  readonly notifications = signal<NotificationAlerte[]>([]);
  readonly panneauOuvert = signal(false);

  // Menu mobile repliable (section responsive) : ferme par defaut, ouvert via le bouton
  // hamburger affiche uniquement sous 900px (voir app-shell.component.scss).
  readonly menuMobileOuvert = signal(false);

  ngOnInit(): void {
    this.chargerNotifications();
  }

  private chargerNotifications(): void {
    this.notificationService.obtenirNotifications().subscribe({
      next: (notifications) => this.notifications.set(notifications),
      error: () => this.notifications.set([])
    });
  }

  basculerMenuMobile(): void {
    this.menuMobileOuvert.update((ouvert) => !ouvert);
  }

  fermerMenuMobile(): void {
    this.menuMobileOuvert.set(false);
  }

  basculerPanneauNotifications(): void {
    this.panneauOuvert.update((ouvert) => !ouvert);
    if (this.panneauOuvert()) {
      this.chargerNotifications();
    }
  }

  get sectionsVisibles(): SectionNav[] {
    return SECTIONS
      .map((section) => ({
        ...section,
        liens: section.liens.filter((l) => this.autorise(l.autoriteRequise))
      }))
      .filter((section) => section.liens.length > 0);
  }

  private autorise(autorite: string | string[] | undefined): boolean {
    if (!autorite) {
      return true;
    }
    const liste = Array.isArray(autorite) ? autorite : [autorite];
    return liste.some((a) => this.authService.possede(a));
  }

  get utilisateurConnecte() {
    return this.authService.utilisateur();
  }

  deconnecter(): void {
    this.authService.deconnecter();
  }
}
