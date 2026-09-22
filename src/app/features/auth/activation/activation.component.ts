import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

// Page publique (aucune authentification requise) : point d'arrivee du lien envoye par email
// a un utilisateur nouvellement cree par un administrateur. C'est ICI, et seulement ici, que
// l'utilisateur choisit son mot de passe : l'administrateur ne le connait jamais (voir
// AuthService.inscrire() cote backend).
@Component({
  selector: 'app-activation',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './activation.component.html',
  styleUrl: './activation.component.scss'
})
export class ActivationComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private token: string | null = null;

  // Etats de l'ecran : verification du lien en cours -> formulaire -> succes, ou lien invalide.
  readonly enVerification = signal(true);
  readonly lienInvalide = signal<string | null>(null);
  readonly prenom = signal<string | null>(null);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);
  readonly succes = signal(false);

  readonly formulaire = this.fb.nonNullable.group({
    motDePasse: ['', [Validators.required, Validators.minLength(10)]],
    confirmation: ['', Validators.required]
  });

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');

    if (!this.token) {
      this.enVerification.set(false);
      this.lienInvalide.set("Lien d'activation incomplet : aucun jeton fourni.");
      return;
    }

    this.authService.verifierActivation(this.token).subscribe({
      next: (info) => {
        this.prenom.set(info.prenom);
        this.enVerification.set(false);
      },
      error: (err) => {
        this.enVerification.set(false);
        this.lienInvalide.set(err?.error?.message ?? "Ce lien d'activation est invalide ou a expire.");
      }
    });
  }

  soumettre(): void {
    if (this.formulaire.invalid || !this.token) {
      this.formulaire.markAllAsTouched();
      return;
    }

    const { motDePasse, confirmation } = this.formulaire.getRawValue();
    if (motDePasse !== confirmation) {
      this.messageErreur.set('Les deux mots de passe ne correspondent pas.');
      return;
    }

    this.enCours.set(true);
    this.messageErreur.set(null);

    this.authService.activerCompte({ token: this.token, motDePasse }).subscribe({
      next: () => {
        this.enCours.set(false);
        this.succes.set(true);
      },
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? "Impossible d'activer le compte. Reessayez.");
      }
    });
  }

  allerVersConnexion(): void {
    this.router.navigate(['/connexion']);
  }
}
