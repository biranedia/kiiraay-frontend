import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// "Mot de passe oublie" (page publique). La reponse est toujours la meme, que l'adresse
// existe ou non : on ne revele jamais si un compte existe.
@Component({
  selector: 'app-mot-de-passe-oublie',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './mot-de-passe-oublie.component.html',
  styleUrl: '../activation/activation.component.scss'
})
export class MotDePasseOublieComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly formulaire = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });
  protected readonly enCours = signal(false);
  protected readonly envoye = signal(false);
  protected readonly messageErreur = signal<string | null>(null);

  soumettre(): void {
    if (this.formulaire.invalid) {
      this.messageErreur.set('Saisissez une adresse email valide.');
      return;
    }
    this.enCours.set(true);
    this.messageErreur.set(null);
    this.authService.demanderReinitialisation(this.formulaire.getRawValue().email).subscribe({
      next: () => {
        this.enCours.set(false);
        this.envoye.set(true);
      },
      error: (err) => {
        this.enCours.set(false);
        // 429 : trop de demandes depuis cette adresse IP
        this.messageErreur.set(err?.status === 429
          ? 'Trop de demandes. Reessayez dans quelques minutes.'
          : (err?.error?.message ?? "La demande n'a pas pu etre envoyee. Reessayez plus tard."));
      }
    });
  }
}
