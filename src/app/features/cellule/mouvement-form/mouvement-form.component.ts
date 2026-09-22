import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CATEGORIES_MOUVEMENT } from '../../../core/models/mouvement.model';
import { MouvementService } from '../services/mouvement.service';

@Component({
  selector: 'app-mouvement-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './mouvement-form.component.html',
  styleUrl: './mouvement-form.component.scss'
})
export class MouvementFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly mouvementService = inject(MouvementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly celluleId = Number(this.route.snapshot.paramMap.get('celluleId'));
  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly mouvementId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.mouvementId !== null;

  readonly categories = CATEGORIES_MOUVEMENT;
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    categorie: [null as (typeof CATEGORIES_MOUVEMENT)[number]['valeur'] | null, Validators.required],
    responsable: [''],
    contact: [''],
    effectif: [0],
    observations: ['']
  });

  constructor() {
    if (this.modeEdition && this.mouvementId !== null) {
      this.mouvementService.trouverParId(this.mouvementId).subscribe({
        next: (mouvement) => this.formulaire.patchValue({
          categorie: mouvement.categorie,
          responsable: mouvement.responsable ?? '',
          contact: mouvement.contact ?? '',
          effectif: mouvement.effectif,
          observations: mouvement.observations ?? ''
        }),
        error: () => this.messageErreur.set('Mouvement introuvable.')
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
      categorie: valeurs.categorie!,
      responsable: valeurs.responsable || undefined,
      contact: valeurs.contact || undefined,
      effectif: valeurs.effectif ?? undefined,
      observations: valeurs.observations || undefined
    };

    const requete$ = this.modeEdition && this.mouvementId !== null
      ? this.mouvementService.modifier(this.mouvementId, requete)
      : this.mouvementService.creer(this.celluleId, requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/cellule/cellules', this.celluleId, 'mouvements']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/cellule/cellules', this.celluleId, 'mouvements']);
  }
}
