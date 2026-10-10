import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Boite de dialogue de saisie d'un motif obligatoire (suspension, archivage).
// Remplace le prompt() natif du navigateur, peu lisible et peu fiable sur mobile.
@Component({
  selector: 'app-motif-dialog',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="voile" (click)="annuler.emit()"></div>
    <div class="boite" role="dialog" aria-modal="true" [attr.aria-label]="titre">
      <h3>{{ titre }}</h3>
      <p class="description">{{ description }}</p>
      <label for="motif">Motif (obligatoire)</label>
      <textarea id="motif" rows="3" maxlength="300" [(ngModel)]="motif" placeholder="Ex : demenagement hors du departement"></textarea>
      <div class="boutons">
        <button type="button" class="bouton-secondaire" (click)="annuler.emit()">Annuler</button>
        <button type="button" class="bouton-primaire" [disabled]="!motif.trim() || enCours" (click)="valider.emit(motif.trim())">
          {{ libelleBouton }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .voile { position: fixed; inset: 0; background: rgba(16, 24, 40, 0.45); z-index: 40; }
    .boite {
      position: fixed; z-index: 41; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: min(440px, calc(100vw - 32px)); background: #fff; border-radius: 12px;
      padding: 20px; box-shadow: 0 12px 32px rgba(16, 24, 40, 0.2);
    }
    h3 { margin: 0 0 6px; font-size: 1.05rem; }
    .description { margin: 0 0 14px; font-size: 0.86rem; color: #6b7280; }
    label { display: block; font-weight: 600; font-size: 0.84rem; margin-bottom: 6px; }
    textarea {
      width: 100%; box-sizing: border-box; border: 1px solid #e3e7ee; border-radius: 8px;
      padding: 10px; font: inherit; font-size: 0.92rem; resize: vertical;
    }
    .boutons { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; flex-wrap: wrap; }
  `]
})
export class MotifDialogComponent {
  @Input() titre = '';
  @Input() description = '';
  @Input() libelleBouton = 'Confirmer';
  @Input() enCours = false;
  @Output() valider = new EventEmitter<string>();
  @Output() annuler = new EventEmitter<void>();

  protected motif = '';
}
