import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppShellComponent } from '../../core/layout/app-shell/app-shell.component';
import { AuthService } from '../../core/services/auth.service';
import { EntreeJournal, FiltresJournal } from '../../core/models/journal.model';
import { JournalService } from './journal.service';

// Consultation du journal d'activite (traçabilite) : lecture seule, filtres et pagination
// cote serveur (le journal grossit en continu, on ne le charge jamais en entier).
@Component({
  selector: 'app-journal',
  standalone: true,
  imports: [FormsModule, DatePipe, AppShellComponent],
  templateUrl: './journal.component.html',
  styleUrl: './journal.component.scss'
})
export class JournalComponent {
  private readonly journalService = inject(JournalService);
  private readonly authService = inject(AuthService);

  protected readonly accesRefuse = !this.authService.possede('ADMIN_GENERAL');
  protected readonly taille = 50;

  protected readonly entrees = signal<EntreeJournal[]>([]);
  protected readonly actions = signal<string[]>([]);
  protected readonly page = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly totalElements = signal(0);
  protected readonly enChargement = signal(false);
  protected readonly messageErreur = signal<string | null>(null);

  protected filtres: FiltresJournal = { login: '', action: '', du: '', au: '' };

  constructor() {
    if (!this.accesRefuse) {
      this.journalService.listerActions().subscribe({ next: (a) => this.actions.set(a) });
      this.charger(0);
    }
  }

  charger(page: number): void {
    this.enChargement.set(true);
    this.messageErreur.set(null);
    this.journalService.rechercher(this.filtres, page, this.taille).subscribe({
      next: (resultat) => {
        this.entrees.set(resultat.contenu);
        this.page.set(resultat.page);
        this.totalPages.set(resultat.totalPages);
        this.totalElements.set(resultat.totalElements);
        this.enChargement.set(false);
      },
      error: (err) => {
        this.messageErreur.set(err?.error?.message ?? 'Impossible de charger le journal.');
        this.enChargement.set(false);
      }
    });
  }

  rechercher(): void {
    this.charger(0);
  }

  reinitialiser(): void {
    this.filtres = { login: '', action: '', du: '', au: '' };
    this.charger(0);
  }
}
