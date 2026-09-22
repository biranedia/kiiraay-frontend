import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Membre, MembreCritereRecherche, StatutMembre } from '../../../core/models/membre.model';
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
    this.enExport.set(true);
    const criteres = this.filtresActifs() ? this.critereCourant() : {};
    this.membreService.exporterCsv(criteres).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const lien = document.createElement('a');
        lien.href = url;
        lien.download = 'membres.csv';
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
