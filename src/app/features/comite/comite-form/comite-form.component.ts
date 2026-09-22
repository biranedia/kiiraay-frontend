import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Cellule } from '../../../core/models/cellule.model';
import { CelluleService } from '../../cellule/services/cellule.service';
import { Responsable } from '../../../core/models/comite.model';
import { ResponsableService } from '../services/responsable.service';
import { ComiteService } from '../services/comite.service';

@Component({
  selector: 'app-comite-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './comite-form.component.html',
  styleUrl: './comite-form.component.scss'
})
export class ComiteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly celluleService = inject(CelluleService);
  private readonly responsableService = inject(ResponsableService);
  private readonly comiteService = inject(ComiteService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly idParam = this.route.snapshot.paramMap.get('id');
  readonly comiteId = this.idParam ? Number(this.idParam) : null;
  readonly modeEdition = this.comiteId !== null;

  readonly cellules = signal<Cellule[]>([]);
  readonly responsables = signal<Responsable[]>([]);
  readonly enCours = signal(false);
  readonly messageErreur = signal<string | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.minLength(2)]],
    capaciteCible: [50],
    seuilAlerte: [45],
    celluleId: [null as number | null, Validators.required],
    responsableId: [null as number | null, Validators.required]
  });

  constructor() {
    this.celluleService.listerToutes().subscribe({
      next: (cellules) => this.cellules.set(cellules),
      error: () => this.messageErreur.set('Impossible de charger les cellules.')
    });
    this.responsableService.listerTous().subscribe({
      next: (responsables) => this.responsables.set(responsables),
      error: () => this.messageErreur.set('Impossible de charger les responsables.')
    });

    if (this.modeEdition && this.comiteId !== null) {
      this.comiteService.trouverParId(this.comiteId).subscribe({
        next: (comite) => {
          this.celluleService.listerToutes().subscribe((cellules) => {
            this.responsableService.listerTous().subscribe((responsables) => {
              const cellule = cellules.find((c) => c.nom === comite.celluleNom);
              const responsable = responsables.find((r) => `${r.prenom} ${r.nom}` === comite.responsableNomComplet);
              this.formulaire.patchValue({
                code: comite.code,
                capaciteCible: comite.capaciteCible,
                seuilAlerte: comite.seuilAlerte,
                celluleId: cellule ? cellule.id : null,
                responsableId: responsable ? responsable.id : null
              });
            });
          });
        },
        error: () => this.messageErreur.set('Comite introuvable.')
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
      code: valeurs.code,
      capaciteCible: valeurs.capaciteCible ?? undefined,
      seuilAlerte: valeurs.seuilAlerte ?? undefined,
      celluleId: valeurs.celluleId!,
      responsableId: valeurs.responsableId!
    };

    const requete$ = this.modeEdition && this.comiteId !== null
      ? this.comiteService.modifier(this.comiteId, requete)
      : this.comiteService.creer(requete);

    requete$.subscribe({
      next: () => this.router.navigate(['/comite/comites']),
      error: (err) => {
        this.enCours.set(false);
        this.messageErreur.set(err?.error?.message ?? 'Une erreur est survenue. Verifiez que le code n\'est pas deja utilise.');
      }
    });
  }

  annuler(): void {
    this.router.navigate(['/comite/comites']);
  }
}
