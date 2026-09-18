import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <div style="padding: 2rem;">
      <h1>Tableau de bord</h1>
      <p>Connecte en tant que : <strong>{{ authService.utilisateur()?.login }}</strong></p>
      <p>Roles / permissions : {{ authService.utilisateur()?.autorites?.join(', ') }}</p>
      <button (click)="authService.deconnecter()">Se deconnecter</button>
    </div>
  `
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
}
