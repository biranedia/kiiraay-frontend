import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ImportMembresResponse, Membre, MembreCritereRecherche, StatutMembre } from '../../../core/models/membre.model';
import { MembreService } from '../services/membre.service';
import { AuthService } from '../../../core/services/auth.service';

import { AppShellComponent } from '../../../core/layout/app-shell/app-shell.component';
@Component({
  selector: 'app-membre-list',
  standalone: true,
  imports: [RouterLink, FormsModule, AppShellComponent],
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

  constructor() {
    this.charger();
  }

  charger(): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.filtresActifs.set(false);
    this.membreService.listerTous().subscribe({
      next: (membres) => {
        this.membres.set(membres);
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
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.filtresActifs.set(true);
    this.membreService.rechercher(this.critereCourant()).subscribe({
      next: (membres) => {
        this.membres.set(membres);
        this.enChargement.set(false);
      },
      error: () => {
        this.messageErreur.set('Impossible d\'effectuer la recherche.');
        this.enChargement.set(false);
      }
    });
  }

  reinitialiserFiltres(): void {
    this.filtres.nom = '';
    this.filtres.prenom = '';
    this.filtres.telephone = '';
    this.filtres.statut = '';
    this.charger();
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
}
