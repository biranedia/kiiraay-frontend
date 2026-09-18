import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Region } from '../../../../core/models/region.model';
import { RegionService } from '../../services/region.service';
import { DepartementService } from '../services/departement.service';

@Component({
  selector: 'app-departement-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './departement-form.component.html',
  styleUrl: './departement-form.component.scss'
})
export class DepartementFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly regionService = inject(RegionService);
  private readonly departementService = inject(DepartementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly departementId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.departementId !== null;

  readonly regions = signal<Region[]>([]);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required, Validators.minLength(2)]],
    responsableEventuel: [''],
    regionId: [null as number | null, Validators.required]
  });

  constructor() {
    this.regionService.listerToutes().subscribe({
      next: (regions) => this.regions.set(regions),
      error: () => this.messageErreur.set('Impossible de charger les regions.')
    });

    if (this.modeEdition && this.departementId !== null) {
      this.departementService.trouverParId(this.departementId).subscribe({
        next: (departement) => {
          this.regionService.listerToutes().subscribe((regions) => {
            const region = regions.find((r) => r.nom === departement.regionNom);
            this.formulaire.patchValue({
              nom: departement.nom,
              code: departement.code,
              responsableEventuel: departement.responsableEventuel ?? '',
              regionId: region ? region.id : null
            });
          });
        },
        error: () => this.messageErreur.set('Departement introuvable.')
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
      code: valeurs.code,
      responsableEventuel: valeurs.responsableEventuel || undefined,
      regionId: valeurs.regionId!
    };

    const requete$ = this.modeEdition && this.departementId !== null
      ? this.departementService.modifier(this.departementId, requete)
      : this.departementService.creer(requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/territorial/departements']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue. Verifiez que le code n\'est pas deja utilise.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/territorial/departements']);
  }
}
