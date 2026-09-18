import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    login: ['', Validators.required],
    motDePasse: ['', Validators.required]
  });

  soumettre(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.messageErreur.set(null);

    this.authService.connecter(this.formulaire.getRawValue()).subscribe({
      next: () => {
        this.enCours.set(false);
        this.router.navigate(['/tableau-de-bord']);
      },
      error: (erreur) => {
        this.enCours.set(false);
        // Le backend renvoie un message clair (401 = identifiants invalides, verrouillage, etc.)
        this.messageErreur.set(erreur.error?.message ?? 'Une erreur est survenue. Reessayez.');
      }
    });
  }
}
