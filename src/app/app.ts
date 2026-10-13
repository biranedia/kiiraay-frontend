import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { ConfirmationHoteComponent } from './shared/confirmation/confirmation-hote.component';
import { RouterOutlet } from '@angular/router';
import { InstallationPwaService } from './core/services/installation-pwa.service';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ConfirmationHoteComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  // Instancie des le demarrage pour capter l'evenement d'installation
  private readonly installation = inject(InstallationPwaService);

  constructor() {
    // Reveille le serveur des l'ouverture de l'appli : il demarre pendant que l'utilisateur
    // saisit ses identifiants, au lieu d'attendre le clic sur "Se connecter".
    inject(HttpClient).get(`${environment.apiUrl}/sante`).subscribe({ error: () => {} });

    // Mise a jour automatique : sans ceci, l'appli installee garde l'ancienne version en cache
    // jusqu'a sa fermeture complete. Des qu'une nouvelle version est prete, on recharge.
    const maj = inject(SwUpdate);
    if (maj.isEnabled) {
      maj.versionUpdates
        .pipe(filter((e) => e.type === 'VERSION_READY'))
        .subscribe(() => document.location.reload());
      // Verifie aussi toutes les 30 minutes pour une appli restee ouverte
      setInterval(() => maj.checkForUpdate().catch(() => {}), 30 * 60 * 1000);
    }
  }
}
