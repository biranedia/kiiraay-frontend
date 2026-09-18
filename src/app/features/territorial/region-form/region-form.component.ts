import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RegionService } from '../services/region.service';

@Component({
  selector: 'app-region-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './region-form.component.html',
  styleUrl: './region-form.component.scss'
})
export class RegionFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly regionService = inject(RegionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly regionId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.regionId !== null;

  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required, Validators.minLength(2)]]
  });

  constructor() {
    if (this.modeEdition && this.regionId !== null) {
      this.regionService.trouverParId(this.regionId).subscribe({
        next: (region) => this.formulaire.patchValue({ nom: region.nom, code: region.code }),
        error: () => this.messageErreur.set('Region introuvable.')
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

    const requete$ = this.modeEdition && this.regionId !== null
      ? this.regionService.modifier(this.regionId, valeurs)
      : this.regionService.creer(valeurs);

    requete$.subscribe({
      next: () => this.router.navigate(['/territorial/regions']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue. Verifiez que le code n\'est pas deja utilise.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/territorial/regions']);
  }
}
