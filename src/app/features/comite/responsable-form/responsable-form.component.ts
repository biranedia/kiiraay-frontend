import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ResponsableService } from '../services/responsable.service';

@Component({
  selector: 'app-responsable-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './responsable-form.component.html',
  styleUrl: './responsable-form.component.scss'
})
export class ResponsableFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly responsableService = inject(ResponsableService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly responsableId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.responsableId !== null;

  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    contact: ['']
  });

  constructor() {
    if (this.modeEdition && this.responsableId !== null) {
      this.responsableService.trouverParId(this.responsableId).subscribe({
        next: (responsable) => this.formulaire.patchValue({
          nom: responsable.nom,
          prenom: responsable.prenom,
          contact: responsable.contact ?? ''
        }),
        error: () => this.messageErreur.set('Responsable introuvable.')
      });
    }
  }

  enregistrer(): void {
    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.messageErreur.set(null);
    const valeurs = this.formulaire.getRawValue();
    const requete = {
      nom: valeurs.nom,
      prenom: valeurs.prenom,
      contact: valeurs.contact || undefined
    };

    const requete$ = this.modeEdition && this.responsableId !== null
      ? this.responsableService.modifier(this.responsableId, requete)
      : this.responsableService.creer(requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/comite/responsables']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/comite/responsables']);
  }
}
