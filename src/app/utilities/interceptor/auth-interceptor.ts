import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { Store } from '@ngrx/store';

import * as AuthActions from './../../core/store/auth/auth.action';

let isHandlingAuthError = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const store = inject(Store);

  const cloned = req.clone({
    withCredentials: true,
  });

  return next(cloned).pipe(
    catchError((error) => {

      // AUTH ENDPOINTS
      const isAuthRequest =
        req.url.includes('/auth/student/login') ||
        req.url.includes('/auth/supervisor/login') ||
        req.url.includes('/auth/administrator/login') ||
        req.url.includes('/auth/access-code/generate');

      // ALLOW LOGIN ERRORS TO BE HANDLED BY NGRX EFFECTS
      if (isAuthRequest && error?.status === 401) {
        return throwError(() => error);
      }

      // SESSION EXPIRED / UNAUTHORIZED API ACCESS
      if (
        !isAuthRequest &&
        (error?.status === 401 || error?.status === 403) &&
        !isHandlingAuthError
      ) {

        isHandlingAuthError = true;

        localStorage.clear();
        sessionStorage.clear();

        document.cookie.split(';').forEach((cookie) => {

          const eqPos = cookie.indexOf('=');

          const name =
            eqPos > -1
              ? cookie.substring(0, eqPos).trim()
              : cookie.trim();

          document.cookie =
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });

        store.dispatch(AuthActions.sessionExpired());

        router.navigate(['/login']).finally(() => {
          isHandlingAuthError = false;
        });
      }

      return throwError(() => error);
    }),
  );
};