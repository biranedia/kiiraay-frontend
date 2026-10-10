import { MotifDialogComponent } from '../../../shared/motif-dialog/motif-dialog.component';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImportMembresResponse, Membre, MembreCritereRecherche, StatutMembre } from '../../../core/models/membre.model';
import { MembreService } from '../services/membre.service';
import { AuthService } from '../../../core/services/auth.service';

import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-membre-list',
  standalone: true,
  imports: [RouterLink, MotifDialogComponent, FormsModule, DatePipe, AppShellComponent],
  templateUrl: './membre-list.component.html',
  styleUrl: './membre-list.component.scss'
})
export class MembreListComponent {
  private readonly membreService = inject(MembreService);
  private readonly authService = inject(AuthService);

  readonly membres = signal<Membre[]>([]);
  readonly enChargement = signal(true);
  readonly messageErreur = signal<string | null>(null);
  readonly enAction = signal<number | null>(null);
  readonly enExport = signal(false);
  readonly enImport = signal(false);
  readonly resultatImport = signal<ImportMembresResponse | null>(null);

  // Filtres de recherche multi-criteres (section 12 du cahier des charges). Modifies
  // via ngModel dans le template, appliques uniquement au clic sur "Rechercher".
  readonly filtres: { nom: string; prenom: string; telephone: string; statut: StatutMembre | '' } = {
    nom: '',
    prenom: '',
    telephone: '',
    statut: ''
  };
  readonly filtresActifs = signal(false);

  // Pagination serveur : on ne charge jamais toute la base (des milliers de fiches)
  readonly taillePage = 20;
  readonly page = signal(0);
  readonly totalPages = signal(0);
  readonly totalElements = signal(0);

  constructor() {
    this.charger(0);
  }

  // Recharge la page demandee (par defaut la page courante, ex. apres une validation)
  // avec les filtres actifs s'il y en a.
  charger(page: number = this.page()): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    const criteres = this.filtresActifs() ? this.critereCourant() : {};
    this.membreService.rechercherPage(criteres, page, this.taillePage).subscribe({
      next: (resultat) => {
        // Page devenue vide (ex. dernier element supprime) : on recule d'une page
        if (resultat.contenu.length === 0 && resultat.page > 0) {
          this.charger(resultat.page - 1);
          return;
        }
        this.membres.set(resultat.contenu);
        this.page.set(resultat.page);
        this.totalPages.set(resultat.totalPages);
        this.totalElements.set(resultat.totalElements);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible de charger les membres.');
        this.enChargement.set(false);
      }
    });
  }

  private critereCourant(): MembreCritereRecherche {
    return {
      nom: this.filtres.nom.trim() || undefined,
      prenom: this.filtres.prenom.trim() || undefined,
      telephone: this.filtres.telephone.trim() || undefined,
      statut: this.filtres.statut || undefined
    };
  }

  rechercher(): void {
    this.filtresActifs.set(true);
    this.charger(0);
  }

  reinitialiserFiltres(): void {
    this.filtres.nom = '';
    this.filtres.prenom = '';
    this.filtres.telephone = '';
    this.filtres.statut = '';
    this.filtresActifs.set(false);
    this.charger(0);
  }

  peutExporter(): boolean {
    return this.authService.possede('EXPORT_DONNEES');
  }

  // Exporte au format CSV les membres correspondant aux filtres actuellement actifs (ou
  // tous si aucun filtre) : declenche un telechargement direct depuis le navigateur.
  exporterCsv(): void {
    this.telecharger(
      this.membreService.exporterCsv(this.filtresActifs() ? this.critereCourant() : {}),
      'membres.csv'
    );
  }

  // Export Excel (.xlsx), memes filtres que l'export CSV : plus pratique pour une ouverture
  // directe dans Excel (mise en forme des entetes, pas de souci d'encodage).
  exporterExcel(): void {
    this.telecharger(
      this.membreService.exporterExcel(this.filtresActifs() ? this.critereCourant() : {}),
      'membres.xlsx'
    );
  }

  private telecharger(source: ReturnType<MembreService['exporterCsv']>, nomFichier: string): void {
    this.enExport.set(true);
    source.subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = nomFichier;
        lien.click();
        window.URL.revokeObjectURL(url);
        this.enExport.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible d\'exporter les membres.');
        this.enExport.set(false);
      }
    });
  }

  peutImporter(): boolean {
    return this.authService.possede('MEMBRE_ECRIRE');
  }

  // Declenche par la selection d'un fichier (input caché, voir template) : envoie le fichier
  // au backend et affiche le rapport detaille (succes/echecs par ligne), puis recharge la
  // liste pour montrer les nouvelles fiches creees.
  importer(evenement: Event): void {
    const input = evenement.target as HTMLInputElement;
    const fichier = input.files?.[0];
    if (!fichier) {
      return;
    }
    this.enImport.set(true);
    this.resultatImport.set(null);
    this.messageErreur.set(null);
    this.membreService.importer(fichier).subscribe({
      next: (resultat) => {
        this.resultatImport.set(resultat);
        this.enImport.set(false);
        input.value = '';
        this.charger();
      },
      error: (err) => {
        this.messageErreur.set(err?.error?.message ?? 'Impossible d\'importer ce fichier.');
        this.enImport.set(false);
        input.value = '';
      }
    });
  }

  fermerResultatImport(): void {
    this.resultatImport.set(null);
  }

  // Ouvre le QR code du membre dans un nouvel onglet (impression/scan facile depuis la
  // plupart des navigateurs) plutot que de forcer un telechargement.
  afficherQrCode(membre: Membre): void {
    this.membreService.genererQrCode(membre.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
      },
      error: () => this.messageErreur.set('Impossible de generer le QR code de ce membre.')
    });
  }

  // Droit general de creation/modification/suppression des fiches membre
  peutGerer(): boolean {
    return this.authService.possede('MEMBRE_ECRIRE');
  }

  // Droit specifique de controle/validation (distinct de la saisie)
  peutValider(): boolean {
    return this.authService.possede('MEMBRE_VALIDER');
  }

  peutModifier(membre: Membre): boolean {
    return this.peutGerer() && (membre.statut === 'BROUILLON' || membre.statut === 'EN_ATTENTE');
  }

  peutSoumettre(membre: Membre): boolean {
    return this.peutGerer() && membre.statut === 'BROUILLON';
  }

  peutValiderOuRejeter(membre: Membre): boolean {
    return this.peutValider() && membre.statut === 'EN_ATTENTE';
  }

  // Une fiche en attente ne peut etre validee que si les deux photos de la CNI ont ete
  // televersees (le backend l'impose deja ; on l'anticipe cote affichage pour expliquer
  // clairement pourquoi le bouton est indisponible). La carte d'electeur ne necessite pas
  // de photo (numero seul suffisant).
  photosManquantes(membre: Membre): boolean {
    return !membre.photoRectoPresente || !membre.photoVersoPresente;
  }

  soumettre(membre: Membre): void {
    this.enAction.set(membre.id);
    this.membreService.soumettre(membre.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de soumettre ce membre.');
      }
    });
  }

  valider(membre: Membre): void {
    this.enAction.set(membre.id);
    this.membreService.valider(membre.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de valider ce membre.');
      }
    });
  }

  rejeter(membre: Membre): void {
    if (!confirm(`Rejeter la fiche de "${membre.prenom} ${membre.nom}" ?`)) {
      return;
    }
    this.enAction.set(membre.id);
    this.membreService.rejeter(membre.id).subscribe({
      next: () => this.charger(),
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Impossible de rejeter ce membre.');
      }
    });
  }

  supprimer(membre: Membre): void {
    if (!confirm(`Supprimer la fiche de "${membre.prenom} ${membre.nom}" ?`)) {
      return;
    }
    this.membreService.supprimer(membre.id).subscribe({
      next: () => this.charger(),
      error: () => this.messageErreur.set('Suppression impossible pour ce membre.')
    });
  }

  // --- Fin du cycle de vie : suspension, reactivation, archivage, restauration ---

  // Boite de saisie du motif ouverte pour une suspension ou un archivage
  readonly dialogue = signal<{ action: 'suspendre' | 'archiver'; id: number; libelle: string } | null>(null);

  peutSuspendre(x: Membre): boolean {
    return this.peutValider() && x.statut === 'VALIDE';
  }

  peutReactiver(x: Membre): boolean {
    return this.peutValider() && x.statut === 'SUSPENDU';
  }

  peutArchiver(x: Membre): boolean {
    return this.peutValider() && (['VALIDE', 'NON_VALIDE', 'SUSPENDU'] as string[]).includes(x.statut);
  }

  peutRestaurer(x: Membre): boolean {
    return this.peutValider() && x.statut === 'ARCHIVE';
  }

  ouvrirDialogue(action: 'suspendre' | 'archiver', x: Membre): void {
    this.dialogue.set({ action, id: x.id, libelle: `${x.prenom} ${x.nom}` });
  }

  confirmerDialogue(motif: string): void {
    const d = this.dialogue();
    if (!d) {
      return;
    }
    const appel = d.action === 'suspendre' ? this.membreService.suspendre(d.id, motif) : this.membreService.archiver(d.id, motif);
    this.executer(d.id, appel, () => this.dialogue.set(null));
  }

  reactiver(x: Membre): void {
    this.executer(x.id, this.membreService.reactiver(x.id));
  }

  restaurer(x: Membre): void {
    if (confirm(`Restaurer ${`${x.prenom} ${x.nom}`} ? La fiche repassera en brouillon et devra etre resoumise.`)) {
      this.executer(x.id, this.membreService.restaurer(x.id));
    }
  }

  private executer(id: number, appel: import('rxjs').Observable<Membre>, apresSucces?: () => void): void {
    this.enAction.set(id);
    appel.subscribe({
      next: () => {
        this.enAction.set(null);
        apresSucces?.();
        this.charger();
      },
      error: (err) => {
        this.enAction.set(null);
        this.messageErreur.set(err?.error?.message ?? 'Action impossible sur ce membre.');
      }
    });
  }
}
