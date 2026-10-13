import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UtilisateurResponse } from '../../../core/models/auth.model';
import { UtilisateurService } from '../services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { forkJoin } from 'rxjs';
import { CommuneVilleService } from '../../territorial/commune-ville/services/commune-ville.service';
import { CelluleService } from '../../cellule/services/cellule.service';
import { CommuneVille } from '../../../core/models/territorial.model';
import { Cellule } from '../../../core/models/cellule.model';
import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';

// Definis par DataInitializer cote backend (meme liste que dans utilisateur-form.component.ts :
// a remplacer par un appel API commun le jour ou elle doit devenir dynamique).
const ROLES_DISPONIBLES = [
  { code: 'ADMIN_GENERAL', libelle: 'Administrateur general' },
  { code: 'ADMIN_DEPARTEMENTAL', libelle: 'Administrateur departemental' },
  { code: 'RESPONSABLE_TERRITORIAL', libelle: 'Responsable territorial' },
  { code: 'RESPONSABLE_CELLULE', libelle: 'Responsable de cellule' },
  { code: 'VALIDATEUR', libelle: 'Validateur' }
];

// Ligne editee "a plat" pour le template : les roles coches sont un Set local, envoye au
// serveur uniquement au clic sur "Enregistrer" pour cette ligne (pas d'appel a chaque case
// cochee, et pas de risque de perdre les autres modifications en cours sur d'autres lignes).
// Roles qui voient tout le departement : le perimetre ne les concerne pas (meme liste que
// PerimetreService.ROLES_GLOBAUX cote backend).
const ROLES_GLOBAUX = ['ADMIN_GENERAL', 'ADMIN_DEPARTEMENTAL', 'VALIDATEUR'];

interface LigneUtilisateur {
  utilisateur: UtilisateurResponse;
  rolesCoches: Set<string>;
  communesCochees: Set<number>;
  cellulesCochees: Set<number>;
  enCours: boolean;
  message: string | null;
}

@Component({
  selector: 'app-utilisateur-liste',
  standalone: true,
  imports: [RouterLink, FormsModule, AppShellComponent],
  templateUrl: './utilisateur-liste.component.html',
  styleUrl: './utilisateur-liste.component.scss'
})
export class UtilisateurListeComponent {
  private readonly utilisateurService = inject(UtilisateurService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly communeVilleService = inject(CommuneVilleService);
  private readonly celluleService = inject(CelluleService);
  protected readonly authService = inject(AuthService);

  // Meme controle cote client que UtilisateurFormComponent : le vrai rempart est le
  // @PreAuthorize("hasRole('ADMIN_GENERAL')") sur UtilisateurController, cote backend.
  protected readonly accesRefuse = !this.authService.possede('ADMIN_GENERAL');

  protected readonly rolesDisponibles = ROLES_DISPONIBLES;
  protected readonly lignes = signal<LigneUtilisateur[]>([]);
  protected readonly communes = signal<CommuneVille[]>([]);
  protected readonly cellules = signal<Cellule[]>([]);
  protected readonly enChargement = signal(true);
  protected readonly messageErreur = signal<string | null>(null);

  constructor() {
    if (!this.accesRefuse) {
      this.charger();
    } else {
      this.enChargement.set(false);
    }
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    // Communes et cellules chargees une seule fois pour tous les editeurs de perimetre
    forkJoin({
      utilisateurs: this.utilisateurService.lister(),
      communes: this.communeVilleService.listerToutes(),
      cellules: this.celluleService.listerToutes()
    }).subscribe({
      next: ({ utilisateurs, communes, cellules }) => {
        this.communes.set(communes);
        this.cellules.set(cellules);
        this.lignes.set(
          utilisateurs.map((utilisateur) => ({
            utilisateur,
            rolesCoches: new Set(utilisateur.roles),
            communesCochees: new Set(utilisateur.communesAssigneesIds ?? []),
            cellulesCochees: new Set(utilisateur.cellulesAssigneesIds ?? []),
            enCours: false,
            message: null
          }))
        );
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger la liste des utilisateurs.');
        this.enChargement.set(false);
        this.rafraichir();
      }
    });
  }

  // Application zoneless (Angular 21, sans zone.js) : modifier un champ d'une ligne dans un
  // callback HTTP ne rafraichit pas l'ecran tout seul. On republie le tableau pour notifier
  // le signal, ce qui redessine les lignes concernees.
  private rafraichir(): void {
    this.lignes.update((lignes) => [...lignes]);
  }

  basculerRole(ligne: LigneUtilisateur, code: string): void {
    if (ligne.rolesCoches.has(code)) {
      ligne.rolesCoches.delete(code);
    } else {
      ligne.rolesCoches.add(code);
    }
  }

  enregistrerRoles(ligne: LigneUtilisateur): void {
    if (ligne.rolesCoches.size === 0) {
      ligne.message = 'Selectionnez au moins un role.';
      return;
    }
    ligne.enCours = true;
    ligne.message = null;
    this.utilisateurService.modifierRoles(ligne.utilisateur.id, { roles: Array.from(ligne.rolesCoches) }).subscribe({
      next: (utilisateur) => {
        ligne.utilisateur = utilisateur;
        ligne.rolesCoches = new Set(utilisateur.roles);
        ligne.enCours = false;
        ligne.message = 'Roles mis a jour.';
        this.rafraichir();
      },
      error: (err) => {
        ligne.enCours = false;
        ligne.message = err?.error?.message ?? 'Echec de la mise a jour des roles.';
        this.rafraichir();
      }
    });
  }

  basculerStatut(ligne: LigneUtilisateur): void {
    ligne.enCours = true;
    ligne.message = null;
    const appel = ligne.utilisateur.actif
      ? this.utilisateurService.desactiver(ligne.utilisateur.id)
      : this.utilisateurService.reactiver(ligne.utilisateur.id);

    appel.subscribe({
      next: (utilisateur) => {
        ligne.utilisateur = utilisateur;
        ligne.enCours = false;
        this.rafraichir();
      },
      error: (err) => {
        ligne.enCours = false;
        ligne.message = err?.error?.message ?? 'Echec du changement de statut.';
        this.rafraichir();
      }
    });
  }

  // Suppression definitive : confirmation explicite, puis retrait de la ligne de la liste
  async supprimer(ligne: LigneUtilisateur): Promise<void> {
    const u = ligne.utilisateur;
    const ok = await this.confirmation.demander(
      `Supprimer definitivement le compte "${u.login}" (${u.prenom} ${u.nom}) ? Cette action est irreversible. ` +
        `Pour seulement bloquer l'acces, utilisez plutot "Desactiver".`,
      'Supprimer',
      true
    );
    if (!ok) {
      return;
    }
    ligne.enCours = true;
    ligne.message = null;
    this.utilisateurService.supprimer(u.id).subscribe({
      next: () => this.lignes.update((lignes) => lignes.filter((l) => l !== ligne)),
      error: (err) => {
        ligne.enCours = false;
        ligne.message = err?.error?.message ?? 'Echec de la suppression du compte.';
        this.rafraichir();
      }
    });
  }

  renvoyerActivation(ligne: LigneUtilisateur): void {
    ligne.enCours = true;
    ligne.message = null;
    this.utilisateurService.renvoyerActivation(ligne.utilisateur.id).subscribe({
      next: () => {
        ligne.enCours = false;
        ligne.message = `Email envoye a ${ligne.utilisateur.email}.`;
        this.rafraichir();
      },
      error: (err) => {
        ligne.enCours = false;
        ligne.message = err?.error?.message ?? "Echec de l'envoi de l'email.";
        this.rafraichir();
      }
    });
  }

  // Le perimetre n'a de sens que pour un compte sans role a portee departementale
  aPorteeRestreinte(ligne: LigneUtilisateur): boolean {
    return !ROLES_GLOBAUX.some((role) => ligne.utilisateur.roles.includes(role));
  }

  basculer(ensemble: Set<number>, id: number): void {
    if (ensemble.has(id)) {
      ensemble.delete(id);
    } else {
      ensemble.add(id);
    }
  }

  enregistrerPerimetre(ligne: LigneUtilisateur): void {
    ligne.enCours = true;
    ligne.message = null;
    this.utilisateurService
      .modifierPerimetre(ligne.utilisateur.id, {
        communesIds: Array.from(ligne.communesCochees),
        cellulesIds: Array.from(ligne.cellulesCochees)
      })
      .subscribe({
        next: (utilisateur) => {
          ligne.utilisateur = utilisateur;
          ligne.enCours = false;
          ligne.message = 'Perimetre mis a jour.';
          this.rafraichir();
        },
        error: (err) => {
          ligne.enCours = false;
          ligne.message = err?.error?.message ?? 'Echec de la mise a jour du perimetre.';
          this.rafraichir();
        }
      });
  }

  estSoiMeme(ligne: LigneUtilisateur): boolean {
    return this.authService.utilisateur()?.login === ligne.utilisateur.login;
  }
}
