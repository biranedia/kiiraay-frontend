import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommuneVille } from '../../../../core/models/territorial.model';
import { CommuneVilleService } from '../../commune-ville/services/commune-ville.service';
import { LocaliteService } from '../services/localite.service';

@Component({
  selector: 'app-localite-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './localite-form.component.html',
  styleUrl: './localite-form.component.scss'
})
export class LocaliteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly communeVilleService = inject(CommuneVilleService);
  private readonly localiteService = inject(LocaliteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly localiteId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.localiteId !== null;

  readonly communesVilles = signal<CommuneVille[]>([]);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    type: ['QUARTIER', Validators.required],
    latitude: [null as number | null],
    longitude: [null as number | null],
    communeVilleId: [null as number | null, Validators.required]
  });

  constructor() {
    this.communeVilleService.listerToutes().subscribe({
      next: (items) => this.communesVilles.set(items),
      error: () => this.messageErreur.set('Impossible de charger les communes/villes.')
    });

    if (this.modeEdition && this.localiteId !== null) {
      this.localiteService.trouverParId(this.localiteId).subscribe({
        next: (item) => {
          this.communeVilleService.listerToutes().subscribe((communes) => {
            const commune = communes.find((c) => c.nom === item.communeVilleNom);
            this.formulaire.patchValue({
              nom: item.nom,
              type: item.type,
              latitude: item.latitude,
              longitude: item.longitude,
              communeVilleId: commune ? commune.id : null
            });
          });
        },
        error: () => this.messageErreur.set('Localite introuvable.')
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
      latitude: valeurs.latitude ?? undefined,
      longitude: valeurs.longitude ?? undefined,
      communeVilleId: valeurs.communeVilleId!
    };

    const requete$ = this.modeEdition && this.localiteId !== null
      ? this.localiteService.modifier(this.localiteId, requete)
      : this.localiteService.creer(requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/territorial/localites']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/territorial/localites']);
  }
}
