import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';

// Permet a un utilisateur deja connecte de changer son propre mot de passe (distinct du
// flux d'activation initiale, qui ne s'applique qu'une seule fois a la creation du compte).
// Utile notamment apres une premiere connexion avec un mot de passe temporaire (voir
// DataInitializer cote backend, qui en genere un a la creation du tout premier compte admin).
@Component({
  selector: 'app-changer-mot-de-passe',
  standalone: true,
  imports: [ReactiveFormsModule, AppShellComponent],
  templateUrl: './changer-mot-de-passe.component.html',
  styleUrl: './changer-mot-de-passe.component.scss'
})
export class ChangerMotDePasseComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);
  readonly succes = signal(false);

  readonly motDePasseActuelVisible = signal(false);
  readonly nouveauMotDePasseVisible = signal(false);
  readonly confirmationVisible = signal(false);

  readonly formulaire = this.fb.nonNullable.group({
    motDePasseActuel: ['', Validators.required],
    nouveauMotDePasse: ['', [Validators.required, Validators.minLength(10)]],
    confirmation: ['', Validators.required]
  });

  basculerVisibilite(champ: 'motDePasseActuel' | 'nouveauMotDePasse' | 'confirmation'): void {
    if (champ === 'motDePasseActuel') {
      this.motDePasseActuelVisible.update((v) => !v);
    } else if (champ === 'nouveauMotDePasse') {
      this.nouveauMotDePasseVisible.update((v) => !v);
    } else {
      this.confirmationVisible.update((v) => !v);
    }
  }

  soumettre(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    const { motDePasseActuel, nouveauMotDePasse, confirmation } = this.formulaire.getRawValue();
    if (nouveauMotDePasse !== confirmation) {
      this.messageErreur.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.enCours.set(true);
    this.messageErreur.set(null);
    this.succes.set(false);

    this.authService.changerMotDePasse({ motDePasseActuel, nouveauMotDePasse }).subscribe({
      next: () => {
        this.enCours.set(false);
        this.succes.set(true);
        this.formulaire.reset();
      },
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de changer le mot de passe.');
      }
    });
  }

  retour(): void {
    this.router.navigate(['/tableau-de-bord']);
  }
}
