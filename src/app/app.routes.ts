import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    // Publique : point d'arrivee du lien recu par email par un utilisateur nouvellement cree.
    // C'est ici qu'il choisit son mot de passe (voir ActivationComponent).
    path: 'activer-compte',
    loadComponent: () =>
      import('./features/auth/activation/activation.component').then((m) => m.ActivationComponent)
  },
  {
    path: 'utilisateurs/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/utilisateur/utilisateur-form/utilisateur-form.component').then(
        (m) => m.UtilisateurFormComponent
      )
  },
  {
    path: 'tableau-de-bord',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'territorial/departements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/departement/departement-list/departement-list.component').then((m) => m.DepartementListComponent)
  },
  {
    path: 'territorial/departements/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/departement/departement-form/departement-form.component').then((m) => m.DepartementFormComponent)
  },
  {
    path: 'territorial/departements/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/departement/departement-form/departement-form.component').then((m) => m.DepartementFormComponent)
  },
  {
    path: 'territorial/communes-villes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/commune-ville/commune-ville-list/commune-ville-list.component').then((m) => m.CommuneVilleListComponent)
  },
  {
    path: 'territorial/communes-villes/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/commune-ville/commune-ville-form/commune-ville-form.component').then((m) => m.CommuneVilleFormComponent)
  },
  {
    path: 'territorial/communes-villes/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/commune-ville/commune-ville-form/commune-ville-form.component').then((m) => m.CommuneVilleFormComponent)
  },
  {
    path: 'territorial/arrondissements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/arrondissement/arrondissement-list/arrondissement-list.component').then((m) => m.ArrondissementListComponent)
  },
  {
    path: 'territorial/arrondissements/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/arrondissement/arrondissement-form/arrondissement-form.component').then((m) => m.ArrondissementFormComponent)
  },
  {
    path: 'territorial/arrondissements/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/arrondissement/arrondissement-form/arrondissement-form.component').then((m) => m.ArrondissementFormComponent)
  },
  {
    path: 'territorial/localites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/localite/localite-list/localite-list.component').then((m) => m.LocaliteListComponent)
  },
  {
    path: 'territorial/localites/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/localite/localite-form/localite-form.component').then((m) => m.LocaliteFormComponent)
  },
  {
    path: 'territorial/localites/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/localite/localite-form/localite-form.component').then((m) => m.LocaliteFormComponent)
  },
  {
    path: 'cellule/cellules',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cellule/cellule-list/cellule-list.component').then((m) => m.CelluleListComponent)
  },
  {
    path: 'cellule/cellules/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cellule/cellule-form/cellule-form.component').then((m) => m.CelluleFormComponent)
  },
  {
    path: 'cellule/cellules/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cellule/cellule-form/cellule-form.component').then((m) => m.CelluleFormComponent)
  },
  {
    path: 'comite/responsables',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comite/responsable-list/responsable-list.component').then((m) => m.ResponsableListComponent)
  },
  {
    path: 'comite/responsables/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comite/responsable-form/responsable-form.component').then((m) => m.ResponsableFormComponent)
  },
  {
    path: 'comite/responsables/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comite/responsable-form/responsable-form.component').then((m) => m.ResponsableFormComponent)
  },
  {
    path: 'comite/comites',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comite/comite-list/comite-list.component').then((m) => m.ComiteListComponent)
  },
  {
    path: 'comite/comites/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comite/comite-form/comite-form.component').then((m) => m.ComiteFormComponent)
  },
  {
    path: 'comite/comites/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/comite/comite-form/comite-form.component').then((m) => m.ComiteFormComponent)
  },
  {
    path: 'membre/membres',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/membre/membre-list/membre-list.component').then((m) => m.MembreListComponent)
  },
  {
    path: 'membre/membres/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/membre/membre-form/membre-form.component').then((m) => m.MembreFormComponent)
  },
  {
    path: 'membre/membres/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/membre/membre-form/membre-form.component').then((m) => m.MembreFormComponent)
  },
  {
    path: 'cellule/cellules/:celluleId/bureau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cellule/bureau-detail/bureau-detail.component').then((m) => m.BureauDetailComponent)
  },
  {
    path: 'cellule/cellules/:celluleId/mouvements',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cellule/mouvement-list/mouvement-list.component').then((m) => m.MouvementListComponent)
  },
  {
    path: 'cellule/cellules/:celluleId/mouvements/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cellule/mouvement-form/mouvement-form.component').then((m) => m.MouvementFormComponent)
  },
  {
    path: 'cellule/cellules/:celluleId/mouvements/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cellule/mouvement-form/mouvement-form.component').then((m) => m.MouvementFormComponent)
  },
  { path: '**', redirectTo: 'tableau-de-bord' }
];
