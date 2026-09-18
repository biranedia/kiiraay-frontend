import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tableau-de-bord', pathMatch: 'full' },
  {
    path: 'connexion',
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'tableau-de-bord',
    loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'territorial/regions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/region-list/region-list.component').then((m) => m.RegionListComponent)
  },
  {
    path: 'territorial/regions/nouveau',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/region-form/region-form.component').then((m) => m.RegionFormComponent)
  },
  {
    path: 'territorial/regions/:id/modifier',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/territorial/region-form/region-form.component').then((m) => m.RegionFormComponent)
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
  { path: '**', redirectTo: 'tableau-de-bord' }
];
