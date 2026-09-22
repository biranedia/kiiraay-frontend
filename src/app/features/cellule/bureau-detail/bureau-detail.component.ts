import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BureauCellule, FONCTIONS_BUREAU, FonctionBureau, TypeFonction } from '../../../core/models/bureau.model';
import { BureauService } from '../services/bureau.service';
import { AuthService } from '../../../core/services/auth.service';
import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';

// Vue "gestion du bureau" d'une cellule : les 8 fonctions fixees par le cahier des
// charges, chacune soit vacante (formulaire de nomination), soit pourvue (titulaire +
// actions modifier/revoquer).
@Component({
  selector: 'app-bureau-detail',
  standalone: true,
  imports: [ReactiveFormsModule, AppShellComponent],
  templateUrl: './bureau-detail.component.html',
  styleUrl: './bureau-detail.component.scss'
})
export class BureauDetailComponent {
  private readonly bureauService = inject(BureauService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  readonly celluleId = Number(this.route.snapshot.paramMap.get('celluleId'));
  readonly fonctionsRef = FONCTIONS_BUREAU;

  readonly bureau = signal<BureauCellule | null>(null);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);
  readonly fonctionEnEdition = signal<TypeFonction | null>(null);
  readonly fonctionEnCoursId = signal<number | null>(null);

  readonly formulaire = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    contact: [''],
    identifiantMembre: ['']
  });

  constructor() {
    this.charger();
  }

  peutGerer(): boolean {
    return this.authService.possede('CELLULE_GERER');
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.bureauService.trouverParCellule(this.celluleId).subscribe({
      next: (bureau) => {
        this.bureau.set(bureau);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set("Impossible de charger le bureau de cette cellule.");
        this.enChargement.set(false);
      }
    });
  }

  titulaireActif(type: TypeFonction): FonctionBureau | undefined {
    return this.bureau()?.fonctions.find((f) => f.typeFonction === type && f.statut === 'actif');
  }

  ouvrirNomination(type: TypeFonction): void {
    this.fonctionEnEdition.set(type);
    this.formulaire.reset({ nom: '', prenom: '', contact: '', identifiantMembre: '' });
  }

  annulerNomination(): void {
    this.fonctionEnEdition.set(null);
  }

  nommer(): void {
    const type = this.fonctionEnEdition();
    if (!type || this.formulaire.invalid) {
      this.formulaire.markAllAsTouched();
      return;
    }
    const valeurs = this.formulaire.getRawValue();
    this.bureauService.nommer(this.celluleId, {
      typeFonction: type,
      nom: valeurs.nom,
      prenom: valeurs.prenom,
      contact: valeurs.contact || undefined,
      identifiantMembre: valeurs.identifiantMembre || undefined
    }).subscribe({
      next: () => {
        this.fonctionEnEdition.set(null);
        this.charger();
      },
      error: (err) => this.messageErreur.set(err?.error?.message ?? 'Impossible de nommer ce titulaire.')
    });
  }

  revoquer(fonction: FonctionBureau): void {
    if (!confirm(`Revoquer ${fonction.prenom} ${fonction.nom} de son poste ?`)) {
      return;
    }
    this.fonctionEnCoursId.set(fonction.id);
    this.bureauService.revoquer(fonction.id).subscribe({
      next: () => {
        this.fonctionEnCoursId.set(null);
        this.charger();
      },
      error: () => {
        this.fonctionEnCoursId.set(null);
        this.messageErreur.set('Impossible de revoquer ce titulaire.');
      }
    });
  }
}
