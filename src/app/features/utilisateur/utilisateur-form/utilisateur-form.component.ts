import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Reserve a ADMIN_GENERAL (voir le controle dans ngOnInit et, cote backend, le
// @PreAuthorize("hasRole('ADMIN_GENERAL')") sur /api/auth/inscrire). Aucun mot de passe n'est
// demande ici : l'utilisateur cree recevra un email pour choisir lui-meme le sien (plus sur
// qu'un mot de passe temporaire transmis par l'administrateur).
@Component({
  selector: 'app-utilisateur-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './utilisateur-form.component.html',
  styleUrl: './utilisateur-form.component.scss'
})
export class UtilisateurFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly accesRefuse = !this.authService.possede('ADMIN_GENERAL');

  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);
  readonly messageSucces = signal<string | null>(null);

  // Roles definis par DataInitializer cote backend. A remplacer par un appel API
  // (GET /api/roles) le jour ou la liste doit devenir dynamique.
  readonly rolesDisponibles = [
    { code: 'ADMIN_GENERAL', libelle: 'Administrateur general' },
    { code: 'ADMIN_DEPARTEMENTAL', libelle: 'Administrateur departemental' },
    { code: 'RESPONSABLE_TERRITORIAL', libelle: 'Responsable territorial' },
    { code: 'RESPONSABLE_CELLULE', libelle: 'Responsable de cellule' },
    { code: 'VALIDATEUR', libelle: 'Validateur' }
  ];

  readonly formulaire = this.fb.nonNullable.group({
    login: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    roles: this.fb.nonNullable.group(
      Object.fromEntries(this.rolesDisponibles.map((r) => [r.code, this.fb.nonNullable.control(false)]))
    )
  });

  soumettre(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    const valeurs = this.formulaire.getRawValue();
    const rolesSelectionnes = Object.entries(valeurs.roles)
      .filter(([, coche]) => coche)
      .map(([code]) => code);

    this.enCours.set(true);
    this.messageErreur.set(null);
    this.messageSucces.set(null);

    this.authService
      .inscrire({
        login: valeurs.login,
        email: valeurs.email,
        nom: valeurs.nom,
        prenom: valeurs.prenom,
        roles: rolesSelectionnes
      })
      .subscribe({
        next: (utilisateur) => {
          this.enCours.set(false);
          this.messageSucces.set(
            `Compte cree pour ${utilisateur.prenom} ${utilisateur.nom}. Un email d'activation a ete envoye a ${utilisateur.email}.`
          );
          this.formulaire.reset();
          Object.keys(this.formulaire.controls.roles.controls).forEach((code) =>
            this.formulaire.controls.roles.get(code)?.setValue(false)
          );
        },
        error: (err) => {
          this.enCours.set(false);
          this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue. Verifiez le login/email (deja utilise ?).');
        }
      });
  }

  annuler(): void {
    this.router.navigate(['/tableau-de-bord']);
  }
}
