import { Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import jsQR from 'jsqr';
import { AppShellComponent } from '../../core/layout/app-shell/app-shell.component';
import { QrCodeService, QrResolution } from '../../core/services/qrcode.service';

// Scan d'un QR code KIIRAAY (cellule, comite ou membre) avec la camera du telephone.
// Decodage par jsQR (pur JavaScript) : fonctionne aussi sur iPhone, contrairement a l'API
// BarcodeDetector. La camera exige HTTPS (ou localhost). Saisie manuelle en secours.
@Component({
  selector: 'app-scanner',
  standalone: true,
  imports: [FormsModule, RouterLink, AppShellComponent],
  templateUrl: './scanner.component.html',
  styleUrl: './scanner.component.scss'
})
export class ScannerComponent implements OnDestroy {
  private readonly qrCodeService = inject(QrCodeService);

  @ViewChild('video') private video?: ElementRef<HTMLVideoElement>;
  private flux: MediaStream | null = null;
  private boucle: number | null = null;
  private readonly canvas = document.createElement('canvas');

  protected readonly cameraActive = signal(false);
  protected readonly resultat = signal<QrResolution | null>(null);
  protected readonly messageErreur = signal<string | null>(null);
  protected readonly enCours = signal(false);
  protected saisieManuelle = '';

  async demarrerCamera(): Promise<void> {
    this.messageErreur.set(null);
    this.resultat.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.messageErreur.set("La camera n'est pas disponible sur cet appareil ou ce navigateur. Utilisez la saisie manuelle.");
      return;
    }
    try {
      // Camera arriere de preference (telephone)
      this.flux = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      this.cameraActive.set(true);
      // Laisse Angular afficher la balise video avant d'y brancher le flux
      setTimeout(() => {
        const video = this.video?.nativeElement;
        if (!video || !this.flux) {
          return;
        }
        video.srcObject = this.flux;
        video.setAttribute('playsinline', 'true');
        void video.play();
        this.analyserImage();
      });
    } catch {
      this.messageErreur.set("Acces a la camera refuse ou impossible. Autorisez la camera dans le navigateur, ou utilisez la saisie manuelle.");
      this.arreterCamera();
    }
  }

  private analyserImage(): void {
    const video = this.video?.nativeElement;
    if (!video || !this.cameraActive()) {
      return;
    }
    if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
      this.canvas.width = video.videoWidth;
      this.canvas.height = video.videoHeight;
      const contexte = this.canvas.getContext('2d', { willReadFrequently: true });
      if (contexte) {
        contexte.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
        const image = contexte.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const code = jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' });
        if (code?.data) {
          this.arreterCamera();
          this.resoudre(code.data);
          return;
        }
      }
    }
    this.boucle = requestAnimationFrame(() => this.analyserImage());
  }

  arreterCamera(): void {
    if (this.boucle !== null) {
      cancelAnimationFrame(this.boucle);
      this.boucle = null;
    }
    this.flux?.getTracks().forEach((piste) => piste.stop());
    this.flux = null;
    this.cameraActive.set(false);
  }

  // Saisie manuelle : accepte le contenu complet du QR ou seulement un identifiant de membre
  validerSaisie(): void {
    const valeur = this.saisieManuelle.trim();
    if (!valeur) {
      return;
    }
    this.resoudre(valeur.startsWith('KIIRAAY:') ? valeur : `KIIRAAY:MEMBRE:${valeur}`);
  }

  private resoudre(valeur: string): void {
    this.enCours.set(true);
    this.messageErreur.set(null);
    this.qrCodeService.resoudre(valeur).subscribe({
      next: (resultat) => {
        this.resultat.set(resultat);
        this.enCours.set(false);
      },
      error: (err) => {
        this.messageErreur.set(err?.error?.message ?? 'QR code non reconnu.');
        this.enCours.set(false);
      }
    });
  }

  nouveauScan(): void {
    this.resultat.set(null);
    this.saisieManuelle = '';
    void this.demarrerCamera();
  }

  ngOnDestroy(): void {
    this.arreterCamera();
  }
}
