import { DatePipe } from '@angular/common';
import { QrCodeService } from '../../../core/services/qrcode.service';
import { MotifDialogComponent } from '../../../shared/motif-dialog/motif-dialog.component';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cellule } from '../../../core/models/cellule.model';
import { CelluleService } from '../services/cellule.service';
import { AuthService } from '../../../core/services/auth.service';

import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-cellule-list',
  standalone: true,
  imports: [RouterLink, MotifDialogComponent, DatePipe, AppShellComponent],
  templateUrl: './cellule-list.component.html',
  styleUrl: './cellule-list.component.scss'
})
export class CelluleListComponent {
  private readonly celluleService = inject(CelluleService);
  private readonly confirmation = inject(ConfirmationService);
  private readonly qrCodeService = inject(QrCodeService);
  private readonly authService = inject(AuthService);

  readonly cellules = signal<Cellule[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);
  readonly enAction = signal<number | null>(null);

  constructor() {
    this.charger();
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.celluleService.listerToutes().subscribe({
      next: (cellules) => {
        this.cellules.set(cellules);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les cellules.');
        this.enChargement.set(false);
      }
    });
  }

  // Droit general de gestion des cellules (creer/modifier/soumettre/supprimer)
  peutGerer(): boolean {
    return this.authService.possede('CELLULE_GERER');
  }

  // Droit specifique de validation (distinct de la gestion : un RESPONSABLE_CELLULE
  // peut gerer ses cellules mais ne doit pas pouvoir les valider lui-meme)
  peutValider(): boolean {
    return this.authService.possede('CELLULE_VALIDER');
  }

  peutSoumettre(cellule: Cellule): boolean {
    return this.peutGerer() && (cellule.statut === 'BROUILLON' || cellule.statut === 'EN_CONSTITUTION');
  }

  peutValiderOuRejeter(cellule: Cellule): boolean {
    return this.peutValider() && cellule.statut === 'EN_ATTENTE';
  }

  peutModifier(cellule: Cellule): boolean {
    return this.peutGerer()
      && cellule.statut !== 'VALIDEE' && cellule.statut !== 'SUSPENDUE' && cellule.statut !== 'INACTIVE';
  }

  soumettre(cellule: Cellule): void {
    this.enAction.set(cellule.id);
    this.celluleService.soumettre(cellule.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de soumettre cette cellule.');
      }
    });
  }

  valider(cellule: Cellule): void {
    this.enAction.set(cellule.id);
    this.celluleService.valider(cellule.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de valider cette cellule.');
      }
    });
  }

  async rejeter(cellule: Cellule): Promise<void> {
    if (!(await this.confirmation.demander(`Rejeter la cellule "${cellule.nom}" ?`))) {
      return;
    }
    this.enAction.set(cellule.id);
    this.celluleService.rejeter(cellule.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de rejeter cette cellule.');
      }
    });
  }

  async supprimer(cellule: Cellule): Promise<void> {
    if (!(await this.confirmation.demander(`Supprimer la cellule "${cellule.nom}" ?`))) {
      return;
    }
    this.celluleService.supprimer(cellule.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible pour cette cellule.')
    });
  }

  afficherQrCode(id: number): void {
    this.qrCodeService.ouvrir('cellules', id).subscribe({
      error: () => this.messageErreur.set('Impossible de generer le QR code.')
    });
  }

  // --- Fin du cycle de vie : suspension, reactivation, archivage, restauration ---

  // Boite de saisie du motif ouverte pour une suspension ou un archivage
  readonly dialogue = signal<{ action: 'suspendre' | 'archiver'; id: number; libelle: string } | null>(null);

  peutSuspendre(x: Cellule): boolean {
    return this.peutValider() && x.statut === 'VALIDEE';
  }

  peutReactiver(x: Cellule): boolean {
    return this.peutValider() && x.statut === 'SUSPENDUE';
  }

  peutArchiver(x: Cellule): boolean {
    return this.peutValider() && (['VALIDEE', 'NON_VALIDEE', 'SUSPENDUE'] as string[]).includes(x.statut);
  }

  peutRestaurer(x: Cellule): boolean {
    return this.peutValider() && x.statut === 'INACTIVE';
  }

  ouvrirDialogue(action: 'suspendre' | 'archiver', x: Cellule): void {
    this.dialogue.set({ action, id: x.id, libelle: `${x.code} - ${x.nom}` });
  }

  confirmerDialogue(motif: string): void {
    const d = this.dialogue();
    if (!d) {
      return;
    }
    const appel = d.action === 'suspendre' ? this.celluleService.suspendre(d.id, motif) : this.celluleService.archiver(d.id, motif);
    this.executer(d.id, appel, () => this.dialogue.set(null));
  }

  reactiver(x: Cellule): void {
    this.executer(x.id, this.celluleService.reactiver(x.id));
  }

  async restaurer(x: Cellule): Promise<void> {
    if (await this.confirmation.demander(`Restaurer ${`${x.code} - ${x.nom}`} ? La fiche repassera en brouillon et devra etre resoumise.`)) {
      this.executer(x.id, this.celluleService.restaurer(x.id));
    }
  }

  private executer(id: number, appel: import('rxjs').Observable<Cellule>, apresSucces?: () => void): void {
    this.enAction.set(id);
    appel.subscribe({
      next: () => {
        this.enAction.set(null);
        apresSucces?.();
        this.charger();
      },
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Action impossible sur cette cellule.');
      }
    });
  }
}
