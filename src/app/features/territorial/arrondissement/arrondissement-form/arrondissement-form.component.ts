import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommuneVille } from '../../../../core/models/territorial.model';
import { CommuneVilleService } from '../../commune-ville/services/commune-ville.service';
import { ArrondissementService } from '../services/arrondissement.service';

@Component({
  selector: 'app-arrondissement-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './arrondissement-form.component.html',
  styleUrl: './arrondissement-form.component.scss'
})
export class ArrondissementFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly communeVilleService = inject(CommuneVilleService);
  private readonly arrondissementService = inject(ArrondissementService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly arrondissementId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.arrondissementId !== null;

  readonly communesVilles = signal<CommuneVille[]>([]);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required, Validators.minLength(2)]],
    communeVilleId: [null as number | null, Validators.required]
  });

  constructor() {
    this.communeVilleService.listerToutes().subscribe({
      next: (items) => this.communesVilles.set(items),
      error: () => this.messageErreur.set('Impossible de charger les communes/villes.')
    });

    if (this.modeEdition && this.arrondissementId !== null) {
      this.arrondissementService.trouverParId(this.arrondissementId).subscribe({
        next: (item) => {
          this.communeVilleService.listerToutes().subscribe((communes) => {
            const commune = communes.find((c) => c.nom === item.communeVilleNom);
            this.formulaire.patchValue({
              nom: item.nom,
              code: item.code,
              communeVilleId: commune ? commune.id : null
            });
          });
        },
        error: () => this.messageErreur.set('Arrondissement introuvable.')
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
      communeVilleId: valeurs.communeVilleId!
    };

    const requete$ = this.modeEdition && this.arrondissementId !== null
      ? this.arrondissementService.modifier(this.arrondissementId, requete)
      : this.arrondissementService.creer(requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/territorial/arrondissements']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue. Verifiez que le code n\'est pas deja utilise.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/territorial/arrondissements']);
  }
}
