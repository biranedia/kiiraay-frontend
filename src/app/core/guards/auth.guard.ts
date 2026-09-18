import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Empeche l'acces aux pages protegees si l'utilisateur n'est pas connecte.
// A appliquer sur toutes les routes sauf /connexion (voir app.routes.ts).
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.estConnecte()) {
    return true;
  }

  router.navigate(['/connexion']);
  return false;
};
