import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { StatistiquesService } from '../../core/services/statistiques.service';
import { StatistiquesCommune, StatistiquesDepartementales } from '../../core/models/statistiques.model';
import { AppShellComponent } from '../../core/layout/app-shell/app-shell.component';

// Libelles et regroupement lisibles pour chaque permission technique (code) : evite d'afficher
// des codes bruts type "MEMBRE_ECRIRE" a l'utilisateur.
interface PermissionAffichee {
  code: string;
  libelle: string;
}

interface GroupePermissions {
  titre: string;
  icone: string;
  permissions: PermissionAffichee[];
}

const LIBELLES_PERMISSIONS: Record<string, string> = {
  TERRITOIRE_GERER: 'Gerer le territoire',
  CELLULE_GERER: 'Gerer les cellules',
  CELLULE_VALIDER: 'Valider les cellules',
  COMITE_GERER: 'Gerer les comites',
  MEMBRE_LIRE: 'Consulter les membres',
  MEMBRE_ECRIRE: 'Modifier les membres',
  MEMBRE_VALIDER: 'Valider les membres',
  CNI_LIRE: 'Consulter les CNI',
  UTILISATEUR_GERER: 'Gerer les utilisateurs',
  EXPORT_DONNEES: 'Exporter les donnees',
  TABLEAU_BORD_LIRE: 'Voir le tableau de bord',
  ADMIN_GENERAL: 'Administration generale'
};

const LIBELLES_STATUTS: Record<string, string> = {
  BROUILLON: 'Brouillon',
  EN_CONSTITUTION: 'En constitution',
  EN_ATTENTE: 'En attente',
  VALIDEE: 'Validees',
  VALIDE: 'Valides',
  NON_VALIDEE: 'Non validees',
  NON_VALIDE: 'Non valides',
  SUSPENDUE: 'Suspendues',
  SUSPENDU: 'Suspendus',
  INACTIVE: 'Inactives'
};

const GROUPES: { titre: string; icone: string; codes: string[] }[] = [
  { titre: 'Territoire', icone: 'territoire', codes: ['TERRITOIRE_GERER'] },
  { titre: 'Cellules & comites', icone: 'cellule', codes: ['CELLULE_GERER', 'CELLULE_VALIDER', 'COMITE_GERER'] },
  { titre: 'Membres', icone: 'membre', codes: ['MEMBRE_LIRE', 'MEMBRE_ECRIRE', 'MEMBRE_VALIDER', 'CNI_LIRE'] },
  { titre: 'Administration', icone: 'utilisateur', codes: ['UTILISATEUR_GERER', 'EXPORT_DONNEES', 'TABLEAU_BORD_LIRE', 'ADMIN_GENERAL'] }
];

const ICONES: Record<string, string> = {
  territoire: 'M12 2 3 7v2h18V7l-9-5ZM4 20h16v-2H4v2Zm2-9v6h3v-6H6Zm5 0v6h2v-6h-2Zm4 0v6h3v-6h-3Z',
  cellule: 'M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z',
  comite: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 20v-2c0-2.2 2.7-4 6-4s6 1.8 6 4v2H2Zm12-4c2.5.4 4 1.8 4 4v2h4v-2c0-2-2.3-3.6-4-4Z',
  membre: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Z',
  utilisateur: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm0 2c-4.4 0-8 2.2-8 5v3h16v-3c0-2.8-3.6-5-8-5Zm7-9 1.5 1.5L17 9l3 3-1.5 1.5L15 10l3-3-1.5-1.5L19 5Z',
  mouvement: 'M13 3 4 14h6l-1 7 9-11h-6l1-7Z'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, AppShellComponent],
  template: `
    <app-shell titre="Tableau de bord" sousTitre="Vue d'ensemble de la plateforme KIIRAAY">
      <section class="bandeau-profil">
        <div class="avatar">{{ initiales() }}</div>
        <div class="infos-profil">
          <p class="nom-utilisateur">{{ authService.utilisateur()?.login }}</p>
          <div class="badges-roles">
            @for (role of rolesAffiches(); track role) {
              <span class="badge-role">{{ role }}</span>
            }
          </div>
        </div>
      </section>

      @if (authService.possede('TABLEAU_BORD_LIRE')) {
        <p class="section-titre">Vue departementale</p>

        @if (chargementStats()) {
          <p class="chargement-stats">Chargement des statistiques...</p>
        } @else if (erreurStats()) {
          <p class="erreur-stats">{{ erreurStats() }}</p>
        } @else if (stats(); as s) {
          <div class="grille-kpi">
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['territoire']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.nombreDepartements }}</p>
                <p class="kpi-label">Departement{{ s.nombreDepartements > 1 ? 's' : '' }}</p>
              </div>
            </div>
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['territoire']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.nombreCommunesVilles }}</p>
                <p class="kpi-label">Communes / villes</p>
              </div>
            </div>
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['territoire']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.nombreLocalites }}</p>
                <p class="kpi-label">Localites</p>
              </div>
            </div>
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['cellule']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.nombreCellules }}</p>
                <p class="kpi-label">Cellules</p>
              </div>
            </div>
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['comite']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.nombreComites }}</p>
                <p class="kpi-label">Comites</p>
              </div>
            </div>
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['membre']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.nombreMembres }}</p>
                <p class="kpi-label">Membres</p>
              </div>
            </div>
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['utilisateur']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.nombreResponsables }}</p>
                <p class="kpi-label">Responsables</p>
              </div>
            </div>
            <div class="carte-kpi">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path [attr.d]="ICONES['mouvement']"/></svg>
              <div>
                <p class="kpi-valeur">{{ s.mouvementsActifs }} / {{ s.nombreMouvements }}</p>
                <p class="kpi-label">Mouvements actifs</p>
              </div>
            </div>
          </div>

          <div class="grille-details">
            <div class="carte-details">
              <h3>Cellules par statut</h3>
              @if (objetVide(s.cellulesParStatut)) {
                <p class="aucune-donnee">Aucune cellule enregistree.</p>
              } @else {
                <div class="liste-statuts">
                  @for (entree of entrees(s.cellulesParStatut); track entree.cle) {
                    <div class="ligne-statut">
                      <span class="badge" [class]="'badge-' + entree.cle.toLowerCase()">{{ libelleStatut(entree.cle) }}</span>
                      <span class="valeur-statut">{{ entree.valeur }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="carte-details">
              <h3>Membres par statut</h3>
              @if (objetVide(s.membresParStatut)) {
                <p class="aucune-donnee">Aucun membre enregistre.</p>
              } @else {
                <div class="liste-statuts">
                  @for (entree of entrees(s.membresParStatut); track entree.cle) {
                    <div class="ligne-statut">
                      <span class="badge" [class]="'badge-' + entree.cle.toLowerCase()">{{ libelleStatut(entree.cle) }}</span>
                      <span class="valeur-statut">{{ entree.valeur }}</span>
                    </div>
                  }
                </div>
              }
            </div>

            <div class="carte-details">
              <h3>Progression des comites</h3>
              <div class="remplissage">
                <div class="barre">
                  <div class="barre-remplie" [style.width.%]="s.tauxRemplissageMoyen"></div>
                </div>
                <p class="detail">Taux de remplissage moyen : {{ s.tauxRemplissageMoyen }}%</p>
              </div>
              <div class="liste-statuts">
                <div class="ligne-statut">
                  <span class="badge badge-complet">Complets</span>
                  <span class="valeur-statut">{{ s.comitesComplets }}</span>
                </div>
                <div class="ligne-statut">
                  <span class="badge badge-incomplet">Incomplets</span>
                  <span class="valeur-statut">{{ s.comitesIncomplets }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="carte-tableau">
            <div class="entete-tableau">
              <h3>Vue par commune / ville</h3>
              @if (chargementCommunes()) {
                <span class="chargement-inline">Chargement...</span>
              }
            </div>
            @if (erreurCommunes()) {
              <p class="erreur-stats">{{ erreurCommunes() }}</p>
            } @else if (!chargementCommunes() && communes().length === 0) {
              <p class="aucune-donnee">Aucune commune enregistree.</p>
            } @else if (communes().length > 0) {
              <div class="tableau-scroll">
                <table class="tableau-communes">
                  <thead>
                    <tr>
                      <th>Commune / ville</th>
                      <th>Localites</th>
                      <th>Cellules</th>
                      <th>Comites</th>
                      <th>Remplissage moyen</th>
                      <th>Membres</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (c of communes(); track c.id) {
                      <tr>
                        <td>{{ c.nom }}</td>
                        <td>{{ c.nombreLocalites }}</td>
                        <td>{{ c.nombreCellules }}</td>
                        <td>
                          {{ c.nombreComites }}
                          @if (c.nombreComites > 0) {
                            <span class="detail-comites">({{ c.comitesComplets }} complet{{ c.comitesComplets > 1 ? 's' : '' }})</span>
                          }
                        </td>
                        <td>{{ c.tauxRemplissageMoyen }}%</td>
                        <td>{{ c.nombreMembres }}</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </div>
        }
      }

      <p class="section-titre">Permissions</p>
      <div class="grille-permissions">
        @for (groupe of groupesPermissions(); track groupe.titre) {
          <div class="carte-permissions">
            <div class="entete-carte">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path [attr.d]="ICONES[groupe.icone]"/></svg>
              <h3>{{ groupe.titre }}</h3>
            </div>
            @if (groupe.permissions.length > 0) {
              <ul class="liste-permissions">
                @for (permission of groupe.permissions; track permission.code) {
                  <li>{{ permission.libelle }}</li>
                }
              </ul>
            } @else {
              <p class="aucune-permission">Aucun acces</p>
            }
          </div>
        }
      </div>

      <p class="section-titre">Acces rapide</p>
      <nav class="raccourcis">
        @if (authService.possede('TERRITOIRE_GERER')) {
          <a routerLink="/territorial/departements">Departements</a>
          <a routerLink="/territorial/arrondissements">Arrondissements</a>
          <a routerLink="/territorial/communes-villes">Communes / Villes</a>
          <a routerLink="/territorial/localites">Localites</a>
        }
        @if (authService.possede('CELLULE_GERER')) {
          <a routerLink="/cellule/cellules">Cellules</a>
        }
        @if (authService.possede('COMITE_GERER')) {
          <a routerLink="/comite/responsables">Responsables</a>
          <a routerLink="/comite/comites">Comites</a>
        }
        @if (authService.possede('MEMBRE_LIRE')) {
          <a routerLink="/membre/membres">Membres</a>
        }
        @if (authService.possede('ADMIN_GENERAL')) {
          <a routerLink="/utilisateurs/nouveau">Nouvel utilisateur</a>
        }
      </nav>
    </app-shell>
  `,
  styles: [`
    .bandeau-profil {
      display: flex;
      align-items: center;
      gap: 18px;
      background: linear-gradient(135deg, #16233f 0%, #1f3a5f 100%);
      border-radius: 14px;
      padding: 22px 26px;
      margin-bottom: 32px;
      box-shadow: 0 4px 14px rgba(22, 35, 63, 0.25);
    }
    .avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #f0d048;
      color: #16233f;
      font-weight: 800;
      font-size: 1.2rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .infos-profil { min-width: 0; }
    .nom-utilisateur { margin: 0 0 8px; font-size: 1.15rem; font-weight: 700; color: #fff; text-transform: capitalize; }
    .badges-roles { display: flex; gap: 8px; flex-wrap: wrap; }
    .badge-role {
      background: rgba(255, 255, 255, 0.14);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.28);
      border-radius: 999px;
      padding: 3px 12px;
      font-size: 0.74rem;
      font-weight: 600;
      letter-spacing: 0.02em;
    }
    .section-titre { font-size: 0.72rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 14px; }
    .chargement-stats, .erreur-stats { color: #6b7280; margin: 0 0 24px; font-size: 0.9rem; }
    .erreur-stats { color: #b3261e; }

    .grille-kpi {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
      gap: 14px;
      margin-bottom: 18px;
    }
    .carte-kpi {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 12px;
      padding: 14px 16px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06);
      color: #1f7a8c;
    }
    .kpi-valeur { margin: 0; font-size: 1.3rem; font-weight: 800; color: #16233f; line-height: 1.1; }
    .kpi-label { margin: 2px 0 0; font-size: 0.76rem; color: #6b7280; }

    .grille-details {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .carte-details {
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06);
    }
    .carte-details h3 { margin: 0 0 14px; font-size: 0.92rem; font-weight: 700; color: #16233f; }
    .liste-statuts { display: flex; flex-direction: column; gap: 10px; }
    .ligne-statut { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
    .valeur-statut { font-weight: 700; color: #16233f; font-size: 0.9rem; }
    .aucune-donnee { margin: 0; font-size: 0.82rem; color: #9aa1ac; font-style: italic; }
    .remplissage { margin-bottom: 14px; }
    .remplissage .barre { background: #eef0f4; border-radius: 8px; height: 8px; overflow: hidden; margin-bottom: 6px; }
    .remplissage .barre-remplie { background: #1e3a5f; height: 100%; transition: width 0.3s ease; }
    .remplissage .detail { margin: 0; font-size: 0.8rem; color: #6b7280; }

    .grille-permissions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .carte-permissions {
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06);
    }
    .entete-carte { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; color: #1f7a8c; }
    .entete-carte h3 { margin: 0; font-size: 0.92rem; font-weight: 700; color: #16233f; }
    .liste-permissions { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .liste-permissions li {
      font-size: 0.85rem;
      color: #374151;
      padding-left: 16px;
      position: relative;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 7px;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #1f7a8c;
      }
    }
    .aucune-permission { margin: 0; font-size: 0.82rem; color: #9aa1ac; font-style: italic; }
    .raccourcis { display: flex; gap: 12px; flex-wrap: wrap; }
    .raccourcis a {
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 10px;
      padding: 12px 18px;
      color: #16233f;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.88rem;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
      transition: border-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, transform 0.1s ease;
    }
    .raccourcis a:hover {
      border-color: #1f7a8c;
      color: #1f7a8c;
      box-shadow: 0 4px 10px rgba(16, 24, 40, 0.08);
      transform: translateY(-1px);
    }

    .carte-tableau {
      background: #fff;
      border: 1px solid #e3e7ee;
      border-radius: 12px;
      padding: 18px 20px;
      box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06);
      margin-bottom: 32px;
    }
    .entete-tableau { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
    .entete-tableau h3 { margin: 0; font-size: 0.92rem; font-weight: 700; color: #16233f; }
    .chargement-inline { font-size: 0.78rem; color: #6b7280; }
    .tableau-scroll { overflow-x: auto; }
    .tableau-communes { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
    .tableau-communes th {
      text-align: left;
      padding: 8px 12px;
      color: #6b7280;
      font-weight: 600;
      font-size: 0.74rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid #e3e7ee;
      white-space: nowrap;
    }
    .tableau-communes td {
      padding: 10px 12px;
      border-bottom: 1px solid #f0f2f6;
      color: #16233f;
      white-space: nowrap;
    }
    .tableau-communes tbody tr:last-child td { border-bottom: none; }
    .tableau-communes tbody tr:hover { background: #f8fafc; }
    .detail-comites { color: #6b7280; font-size: 0.78rem; margin-left: 4px; }
  `]
})
export class DashboardComponent {
  protected readonly authService = inject(AuthService);
  private readonly statistiquesService = inject(StatistiquesService);
  protected readonly ICONES = ICONES;

  protected readonly stats = signal<StatistiquesDepartementales | null>(null);
  protected readonly chargementStats = signal(false);
  protected readonly erreurStats = signal<string | null>(null);

  protected readonly communes = signal<StatistiquesCommune[]>([]);
  protected readonly chargementCommunes = signal(false);
  protected readonly erreurCommunes = signal<string | null>(null);

  constructor() {
    if (this.authService.possede('TABLEAU_BORD_LIRE')) {
      this.chargerStatistiques();
      this.chargerCommunes();
    }
  }

  private chargerStatistiques(): void {
    this.chargementStats.set(true);
    this.erreurStats.set(null);
    this.statistiquesService.vueDepartementale().subscribe({
      next: (donnees) => {
        this.stats.set(donnees);
        this.chargementStats.set(false);
      },
      error: () => {
        this.erreurStats.set('Impossible de charger les statistiques.');
        this.chargementStats.set(false);
      }
    });
  }

  private chargerCommunes(): void {
    this.chargementCommunes.set(true);
    this.erreurCommunes.set(null);
    this.statistiquesService.vueParCommunes().subscribe({
      next: (donnees) => {
        this.communes.set(donnees);
        this.chargementCommunes.set(false);
      },
      error: () => {
        this.erreurCommunes.set('Impossible de charger la vue par commune.');
        this.chargementCommunes.set(false);
      }
    });
  }

  protected objetVide(obj: Record<string, number>): boolean {
    return Object.keys(obj ?? {}).length === 0;
  }

  protected entrees(obj: Record<string, number>): { cle: string; valeur: number }[] {
    return Object.entries(obj ?? {}).map(([cle, valeur]) => ({ cle, valeur }));
  }

  protected libelleStatut(code: string): string {
    return LIBELLES_STATUTS[code] ?? code;
  }

  protected readonly initiales = computed(() => {
    const login = this.authService.utilisateur()?.login ?? '';
    return login.slice(0, 2).toUpperCase() || '??';
  });

  // Les roles sont les autorites prefixees "ROLE_" (convention Spring Security) ; le reste
  // des autorites correspond aux permissions unitaires, affichees plus bas par groupe.
  protected readonly rolesAffiches = computed(() => {
    const autorites = this.authService.utilisateur()?.autorites ?? [];
    return autorites
      .filter((a) => a.startsWith('ROLE_'))
      .map((a) => a.replace('ROLE_', '').replace(/_/g, ' '));
  });

  protected readonly groupesPermissions = computed<GroupePermissions[]>(() => {
    const autorites = new Set(this.authService.utilisateur()?.autorites ?? []);
    return GROUPES.map((groupe) => ({
      titre: groupe.titre,
      icone: groupe.icone,
      permissions: groupe.codes
        .filter((code) => autorites.has(code))
        .map((code) => ({ code, libelle: LIBELLES_PERMISSIONS[code] ?? code }))
    }));
  });
}
