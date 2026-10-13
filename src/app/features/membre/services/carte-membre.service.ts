import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Membre } from '../../../core/models/membre.model';
import { MembreService } from './membre.service';

// Carte de membre au format carte bancaire (85,6 x 54 mm), recto + verso, generee en PDF
// dans le navigateur. Volontairement SANS numero de CNI ni date de naissance : la carte
// circule (impression, WhatsApp), elle ne porte que l'identite et le QR de verification.
// jsPDF est charge a la demande pour ne pas alourdir la liste des membres.
@Injectable({ providedIn: 'root' })
export class CarteMembreService {
  private readonly membreService = inject(MembreService);

  private static readonly LARGEUR = 85.6;
  private static readonly HAUTEUR = 54;
  private static readonly BLEU: [number, number, number] = [30, 58, 95];
  private static readonly ROUGE: [number, number, number] = [190, 30, 45];

  async generer(membre: Membre): Promise<void> {
    // La carte atteste l'appartenance : reservee aux membres valides (actifs)
    if (membre.statut !== 'VALIDE') {
      throw new Error('La carte de membre est reservee aux membres valides.');
    }
    const [{ jsPDF }, embleme, fond, qr, photo] = await Promise.all([
      import('jspdf'),
      this.chargerImage('assets/images/emblem-kiiraay.png'),
      // Photo officielle deja eclaircie (assets/images/carte-fond.jpg) : le texte reste lisible
      this.chargerImage('assets/images/carte-fond.jpg'),
      this.blobVersDataUrl(await firstValueFrom(this.membreService.genererQrCode(membre.id))),
      membre.photoProfilPresente
        ? firstValueFrom(this.membreService.recupererPhotoProfil(membre.id))
            .then((b) => this.blobVersDataUrl(b))
            .catch(() => null)
        : Promise.resolve(null)
    ]);

    const L = CarteMembreService.LARGEUR;
    const H = CarteMembreService.HAUTEUR;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: [L, H] });

    // ---------- RECTO ----------
    doc.addImage(fond, 'JPEG', 0, 0, L, H);
    this.bandeau(doc, L);
    doc.addImage(embleme, 'PNG', 3, 1.6, 9, 6.9);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KIIRAAY', 14, 5.4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.text('Les Patriotes Républicains - Carte de membre', 14, 8.3);

    // Photo (ou cadre vide si aucune photo de profil)
    const xPhoto = 4, yPhoto = 14, lPhoto = 20, hPhoto = 25;
    doc.setDrawColor(200, 205, 215);
    doc.setLineWidth(0.3);
    if (photo) {
      doc.addImage(photo, this.formatImage(photo), xPhoto, yPhoto, lPhoto, hPhoto);
    } else {
      doc.setFillColor(240, 242, 246);
      doc.rect(xPhoto, yPhoto, lPhoto, hPhoto, 'F');
      doc.setTextColor(150, 155, 165);
      doc.setFontSize(5);
      doc.text('Photo', xPhoto + lPhoto / 2, yPhoto + hPhoto / 2, { align: 'center' });
    }
    doc.rect(xPhoto, yPhoto, lPhoto, hPhoto);

    // Identite
    const xTexte = 27;
    doc.setTextColor(20, 30, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(this.couper(doc, membre.prenom, 31), xTexte, 18);
    doc.text(this.couper(doc, (membre.nom || '').toUpperCase(), 31), xTexte, 22.5);

    this.champ(doc, 'Identifiant', membre.identifiantUnique || '-', xTexte, 28);
    this.champ(doc, 'Comité', membre.comiteCode || '-', xTexte, 33.5);
    this.statut(doc, membre, xTexte, 37.5);

    // QR de verification
    doc.addImage(qr, 'PNG', L - 23.5, 15, 20, 20);
    doc.setTextColor(110, 115, 125);
    doc.setFontSize(4.2);
    doc.text('Scanner pour vérifier', L - 13.5, 37.5, { align: 'center' });

    // Pied de carte
    doc.setDrawColor(...CarteMembreService.ROUGE);
    doc.setLineWidth(0.8);
    doc.line(0, H - 4.5, L, H - 4.5);
    doc.setTextColor(110, 115, 125);
    doc.setFontSize(4.5);
    doc.text(`Émise le ${new Date().toLocaleDateString('fr-FR')}`, 4, H - 1.6);
    doc.text('Département de Dagana', L - 4, H - 1.6, { align: 'right' });

    // ---------- VERSO ----------
    doc.addPage([L, H], 'landscape');
    this.bandeau(doc, L);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Informations importantes', L / 2, 6.2, { align: 'center' });

    doc.setTextColor(30, 40, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.6);
    const consignes = [
      '- Cette carte est personnelle et ne peut être prêtée.',
      '- Elle atteste de votre inscription sur la base départementale KIIRAAY.',
      '- Sa validité se vérifie en scannant le QR code au recto :',
      '  seul un responsable habilité peut consulter la fiche.',
      '- En cas de perte, prévenez le responsable de votre cellule.'
    ];
    let y = 15;
    for (const ligne of consignes) {
      doc.text(ligne, 5, y);
      y += 4.4;
    }
    doc.addImage(embleme, 'PNG', L / 2 - 6, 37, 12, 9.2);
    doc.setDrawColor(...CarteMembreService.ROUGE);
    doc.setLineWidth(0.8);
    doc.line(0, H - 4.5, L, H - 4.5);
    doc.setTextColor(110, 115, 125);
    doc.setFontSize(4.5);
    doc.text('« Diomaye Moom Sa Ndam »', L / 2, H - 1.6, { align: 'center' });

    const nomFichier = `carte-membre-${(membre.identifiantUnique || membre.id).toString().replace(/[^\w-]/g, '_')}.pdf`;
    doc.save(nomFichier);
  }

  private bandeau(doc: import('jspdf').jsPDF, largeur: number): void {
    doc.setFillColor(...CarteMembreService.BLEU);
    doc.rect(0, 0, largeur, 10, 'F');
  }

  private champ(doc: import('jspdf').jsPDF, libelle: string, valeur: string, x: number, y: number): void {
    doc.setTextColor(120, 125, 135);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(4.6);
    doc.text(libelle.toUpperCase(), x, y - 2.2);
    doc.setTextColor(20, 30, 50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.4);
    doc.text(this.couper(doc, valeur, 31), x, y + 0.4);
  }

  // Pastille de statut : vert si valide, sinon orange/rouge avec le libelle
  private statut(doc: import('jspdf').jsPDF, membre: Membre, x: number, y: number): void {
    const libelles: Record<string, string> = {
      VALIDE: 'MEMBRE VALIDÉ', EN_ATTENTE: 'EN ATTENTE', BROUILLON: 'BROUILLON',
      NON_VALIDE: 'NON VALIDÉ', SUSPENDU: 'SUSPENDU', ARCHIVE: 'ARCHIVÉ'
    };
    const couleur: [number, number, number] = membre.statut === 'VALIDE' ? [22, 130, 70]
      : membre.statut === 'EN_ATTENTE' || membre.statut === 'BROUILLON' ? [200, 120, 10] : [180, 35, 24];
    const texte = libelles[membre.statut] ?? membre.statut;
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    const largeur = doc.getTextWidth(texte) + 4;
    doc.setFillColor(...couleur);
    doc.roundedRect(x, y, largeur, 3.6, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.text(texte, x + 2, y + 2.55);
  }

  // Tronque un texte trop long pour la largeur disponible (en mm)
  private couper(doc: import('jspdf').jsPDF, texte: string, largeurMax: number): string {
    let t = texte ?? '';
    while (t.length > 1 && doc.getTextWidth(t) > largeurMax) {
      t = t.slice(0, -1);
    }
    return t === texte ? t : t.slice(0, -1) + '.';
  }

  private formatImage(dataUrl: string): string {
    return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
  }

  private async chargerImage(url: string): Promise<string> {
    const reponse = await fetch(url);
    return this.blobVersDataUrl(await reponse.blob());
  }

  private blobVersDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const lecteur = new FileReader();
      lecteur.onload = () => resolve(lecteur.result as string);
      lecteur.onerror = reject;
      lecteur.readAsDataURL(blob);
    });
  }
}
