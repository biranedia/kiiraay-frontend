import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Localite } from '../../../core/models/territorial.model';
import { LocaliteService } from '../../territorial/localite/services/localite.service';
import { CelluleService } from '../services/cellule.service';

@Component({
  selector: 'app-cellule-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './cellule-form.component.html',
  styleUrl: './cellule-form.component.scss'
})
export class CelluleFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly localiteService = inject(LocaliteService);
  private readonly celluleService = inject(CelluleService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly celluleId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.celluleId !== null;

  readonly localites = signal<Localite[]>([]);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    type: ['QUARTIER', Validators.required],
    pays: [''],
    observations: [''],
    localiteId: [null as number | null, Validators.required]
  });

  constructor() {
    this.localiteService.listerToutes().subscribe({
      next: (localites) => this.localites.set(localites),
      error: () => this.messageErreur.set('Impossible de charger les localites.')
    });

    if (this.modeEdition && this.celluleId !== null) {
      this.celluleService.trouverParId(this.celluleId).subscribe({
        next: (cellule) => {
          this.localiteService.listerToutes().subscribe((localites) => {
            const localite = localites.find((l) => l.nom === cellule.localiteNom);
            this.formulaire.patchValue({
              code: cellule.code,
              nom: cellule.nom,
              type: cellule.type,
              pays: cellule.pays ?? '',
              observations: cellule.observations ?? '',
              localiteId: localite ? localite.id : null
            });
          });
        },
        error: () => this.messageErreur.set('Cellule introuvable.')
      });
    }
  }

  get estDiaspora(): boolean {
    return this.formulaire.controls.type.value === 'DIASPORA';
  }

  enregistrer(): void {
    if (this.estDiaspora && !this.formulaire.controls.pays.value) {
      this.formulaire.controls.pays.setErrors({ required: true });
    }

    if (this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }

    this.enCours.set(true);
    this.messageErreur.set(null);
    const valeurs = this.formulaire.getRawValue();
    const requete = {
      code: valeurs.code,
      nom: valeurs.nom,
      type: valeurs.type as 'QUARTIER' | 'VILLAGE' | 'DIASPORA',
      pays: valeurs.pays || undefined,
      observations: valeurs.observations || undefined,
      localiteId: valeurs.localiteId!
    };

    const requete$ = this.modeEdition && this.celluleId !== null
      ? this.celluleService.modifier(this.celluleId, requete)
      : this.celluleService.creer(requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/cellule/cellules']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/cellule/cellules']);
  }
}
