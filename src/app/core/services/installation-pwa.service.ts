import { Injectable, signal } from '@angular/core';

// Evenement non standard (Chrome/Edge/Android) emis quand l'appli est installable
interface EvenementInstallation extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Gere le bouton "Installer l'application" :
// - Android / Chrome / Edge : capture l'evenement beforeinstallprompt et ouvre la vraie fenetre d'installation
// - iPhone / iPad (Safari) : pas d'API, on affiche la marche a suivre (Partager > Sur l'ecran d'accueil)
// Doit etre instancie au demarrage (voir App) pour ne pas rater l'evenement, emis tres tot.
@Injectable({ providedIn: 'root' })
export class InstallationPwaService {
  private evenement: EvenementInstallation | null = null;

  // Vrai quand le navigateur propose l'installation native
  readonly installable = signal(false);
  // Vrai sur iOS hors mode installe : il faut guider l'utilisateur
  readonly estIos = signal(false);
  // Vrai si l'appli tourne deja en mode installe : on masque le bouton
  readonly dejaInstallee = signal(false);
  readonly aideIosVisible = signal(false);

  constructor() {
    if (typeof window === 'undefined') {
      return;
    }
    const modeAutonome =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    this.dejaInstallee.set(modeAutonome);
    this.estIos.set(/iphone|ipad|ipod/i.test(navigator.userAgent) && !modeAutonome);

    window.addEventListener('beforeinstallprompt', (e) => {
      // Empeche la mini-barre automatique : on propose notre propre bouton
      e.preventDefault();
      this.evenement = e as EvenementInstallation;
      this.installable.set(true);
    });
    window.addEventListener('appinstalled', () => {
      this.evenement = null;
      this.installable.set(false);
      this.dejaInstallee.set(true);
    });
  }

  // Le bouton est utile si l'installation native est possible ou si on est sur iOS
  get boutonVisible(): boolean {
    return !this.dejaInstallee() && (this.installable() || this.estIos());
  }

  async installer(): Promise<void> {
    if (this.evenement) {
      await this.evenement.prompt();
      const choix = await this.evenement.userChoice;
      if (choix.outcome === 'accepted') {
        this.installable.set(false);
      }
      this.evenement = null;
      return;
    }
    if (this.estIos()) {
      this.aideIosVisible.update((v) => !v);
    }
  }
}
