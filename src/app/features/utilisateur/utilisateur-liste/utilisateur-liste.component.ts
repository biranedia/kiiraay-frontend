import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { UtilisateurResponse } from '../../../core/models/auth.model';
import { UtilisateurService } from '../services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';
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
interface LigneUtilisateur {
  utilisateur: UtilisateurResponse;
  rolesCoches: Set<string>;
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
  protected readonly authService = inject(AuthService);

  // Meme controle cote client que UtilisateurFormComponent : le vrai rempart est le
  // @PreAuthorize("hasRole('ADMIN_GENERAL')") sur UtilisateurController, cote backend.
  protected readonly accesRefuse = !this.authService.possede('ADMIN_GENERAL');

  protected readonly rolesDisponibles = ROLES_DISPONIBLES;
  protected readonly lignes = signal<LigneUtilisateur[]>([]);
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
    this.utilisateurService.lister().subscribe({
      next: (utilisateurs) => {
        this.lignes.set(
          utilisateurs.map((utilisateur) => ({
            utilisateur,
            rolesCoches: new Set(utilisateur.roles),
            enCours: false,
            message: null
          }))
        );
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger la liste des utilisateurs.');
        this.enChargement.set(false);
      }
    });
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
      },
      error: (err) => {
        ligne.enCours = false;
        ligne.message = err?.error?.message ?? 'Echec de la mise a jour des roles.';
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
      },
      error: (err) => {
        ligne.enCours = false;
        ligne.message = err?.error?.message ?? 'Echec du changement de statut.';
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
      },
      error: (err) => {
        ligne.enCours = false;
        ligne.message = err?.error?.message ?? "Echec de l'envoi de l'email.";
      }
    });
  }

  estSoiMeme(ligne: LigneUtilisateur): boolean {
    return this.authService.utilisateur()?.login === ligne.utilisateur.login;
  }
}
