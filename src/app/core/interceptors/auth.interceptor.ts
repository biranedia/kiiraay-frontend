import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const URLS_SANS_TOKEN = ['/auth/login', '/auth/refresh'];

// Intercepteur fonctionnel (style Angular moderne, pas de classe/module a declarer) :
// 1. ajoute automatiquement le Bearer token sur chaque requete vers l'API
// 2. si le serveur repond 401 (access token expire), tente UNE fois un refresh silencieux
//    et rejoue la requete initiale, sans que l'utilisateur ne remarque rien.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const doitAjouterToken = !URLS_SANS_TOKEN.some((url) => req.url.includes(url));
  const token = authService.getAccessToken();

  const requeteAvecToken = doitAjouterToken && token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(requeteAvecToken).pipe(
    catchError((erreur: HttpErrorResponse) => {
      if (erreur.status === 401 && doitAjouterToken) {
        return authService.rafraichirToken().pipe(
          switchMap(() => {
            const nouveauToken = authService.getAccessToken();
            const requeteRejouee = req.clone({ setHeaders: { Authorization: `Bearer ${nouveauToken}` } });
            return next(requeteRejouee);
          }),
          catchError((erreurRefresh) => {
            // Le refresh token est lui aussi invalide/expire : session definitivement terminee
            authService.deconnecter();
            return throwError(() => erreurRefresh);
          })
        );
      }
      return throwError(() => erreur);
    })
  );
};
