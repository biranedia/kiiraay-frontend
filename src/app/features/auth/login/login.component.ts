import { RouterLink } from '@angular/router';
import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InstallationPwaService } from '../../../core/services/installation-pwa.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly installation = inject(InstallationPwaService);
  // Affiche un message si le serveur met du temps (reveil apres inactivite)
  readonly lent = signal(false);
  private minuterieLent?: ReturnType<typeof setTimeout>;

  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);
  readonly motDePasseVisible = signal(false);

  readonly formulaire = this.fb.nonNullable.group({
    login: ['', Validators.required],
    motDePasse: ['', Validators.required]
  });

  basculerVisibiliteMotDePasse(): void {
    this.motDePasseVisible.update((visible) => !visible);
  }

  soumettre(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.messageErreur.set(null);
    this.lent.set(false);
    this.minuterieLent = setTimeout(() => this.lent.set(true), 4000);

    this.authService.connecter(this.formulaire.getRawValue()).subscribe({
      next: () => {
        clearTimeout(this.minuterieLent);
        this.enCours.set(false);
        this.router.navigate(['/tableau-de-bord']);
      },
      error: (erreur) => {
        clearTimeout(this.minuterieLent);
        this.lent.set(false);
        this.enCours.set(false);
        // Le backend renvoie un message clair (401 = identifiants invalides, verrouillage, etc.)
        this.messageErreur.set(erreur.error?.message ?? 'Une erreur est survenue. Reessayez.');
      }
    });
  }
}
