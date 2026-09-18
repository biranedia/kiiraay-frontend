import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Departement } from '../../../../core/models/territorial.model';
import { DepartementService } from '../../departement/services/departement.service';
import { CommuneVilleService } from '../services/commune-ville.service';

@Component({
  selector: 'app-commune-ville-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './commune-ville-form.component.html',
  styleUrl: './commune-ville-form.component.scss'
})
export class CommuneVilleFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly departementService = inject(DepartementService);
  private readonly communeVilleService = inject(CommuneVilleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly communeVilleId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.communeVilleId !== null;

  readonly departements = signal<Departement[]>([]);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    type: ['COMMUNE', Validators.required],
    code: ['', [Validators.required, Validators.minLength(2)]],
    departementId: [null as number | null, Validators.required]
  });

  constructor() {
    this.departementService.listerTous().subscribe({
      next: (departements) => this.departements.set(departements),
      error: () => this.messageErreur.set('Impossible de charger les departements.')
    });

    if (this.modeEdition && this.communeVilleId !== null) {
      this.communeVilleService.trouverParId(this.communeVilleId).subscribe({
        next: (item) => {
          this.departementService.listerTous().subscribe((departements) => {
            const departement = departements.find((d) => d.nom === item.departementNom);
            this.formulaire.patchValue({
              nom: item.nom,
              type: item.type,
              code: item.code,
              departementId: departement ? departement.id : null
            });
          });
        },
        error: () => this.messageErreur.set('Commune/ville introuvable.')
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
      type: valeurs.type,
      code: valeurs.code,
      departementId: valeurs.departementId!
    };

    const requete$ = this.modeEdition && this.communeVilleId !== null
      ? this.communeVilleService.modifier(this.communeVilleId, requete)
      : this.communeVilleService.creer(requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/territorial/communes-villes']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue. Verifiez que le code n\'est pas deja utilise.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/territorial/communes-villes']);
  }
}
