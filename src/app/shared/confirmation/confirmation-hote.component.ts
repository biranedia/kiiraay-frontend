import { Component, HostListener, inject } from '@angular/core';
import { ConfirmationService } from '../../core/services/confirmation.service';

// Affiche la demande de confirmation en cours (place une seule fois, dans app.html)
@Component({
  selector: 'app-confirmation-hote',
  standalone: true,
  template: `
    @if (confirmation.demande(); as d) {
      <div class="voile" (click)="confirmation.repondre(false)"></div>
      <div class="boite" role="alertdialog" aria-modal="true" [attr.aria-label]="d.message">
        <p class="message">{{ d.message }}</p>
        <div class="boutons">
          <button type="button" class="bouton-secondaire" (click)="confirmation.repondre(false)">Annuler</button>
          <button type="button" [class]="d.danger ? 'bouton-danger' : 'bouton-primaire'" (click)="confirmation.repondre(true)">
            {{ d.libelleBouton }}
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .voile { position: fixed; inset: 0; background: rgba(16, 24, 40, 0.45); z-index: 60; }
    .boite {
      position: fixed; z-index: 61; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: min(420px, calc(100vw - 32px)); background: #fff; border-radius: 12px;
      padding: 20px; box-shadow: 0 12px 32px rgba(16, 24, 40, 0.2);
    }
    .message { margin: 0 0 18px; font-size: 0.95rem; line-height: 1.45; }
    .boutons { display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap; }
    .bouton-danger {
      background: #b3261e; color: #fff; border: none; border-radius: 8px;
      padding: 9px 18px; font-weight: 600; cursor: pointer;
    }
  `]
})
export class ConfirmationHoteComponent {
  protected readonly confirmation = inject(ConfirmationService);

  // Echap = annuler
  @HostListener('document:keydown.escape')
  annuler(): void {
    if (this.confirmation.demande()) {
      this.confirmation.repondre(false);
    }
  }
}
