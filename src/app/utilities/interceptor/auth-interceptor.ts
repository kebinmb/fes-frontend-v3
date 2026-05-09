import { HttpInterceptorFn } from '@angular/common/http';

import { inject } from '@angular/core';

import { Router } from '@angular/router';

import { catchError, throwError } from 'rxjs';

import { ToastFacade } from '../../core/store/toast/toast.facade';

import { Store } from '@ngrx/store';

import * as AuthActions from './../../core/store/auth/auth.action';

let isHandlingAuthError = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const toastFacade = inject(ToastFacade);

  const router = inject(Router);

  const store = inject(Store);

  /* =========================================
     ALWAYS SEND COOKIES
  ========================================= */

  const cloned = req.clone({
    withCredentials: true,
  });

  return next(cloned).pipe(

    catchError((error) => {

      /* =========================================
         HANDLE 401 / 403
      ========================================= */

      if (
        (error?.status === 401 || error?.status === 403) &&
        !isHandlingAuthError
      ) {

        isHandlingAuthError = true;

        /* =========================================
           CLEAR ALL BROWSER STORAGE
        ========================================= */

        localStorage.clear();

        sessionStorage.clear();

        /* =========================================
           OPTIONAL:
           CLEAR NON-HTTPONLY COOKIES
        ========================================= */

        document.cookie.split(';').forEach((cookie) => {

          const eqPos = cookie.indexOf('=');

          const name =
            eqPos > -1
              ? cookie.substring(0, eqPos).trim()
              : cookie.trim();

          document.cookie =
            `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        });

        /* =========================================
           CLEAR NGRX AUTH STATE
        ========================================= */

        store.dispatch(AuthActions.logout());

        /* =========================================
           SHOW TOAST
        ========================================= */

        toastFacade.showToast(
          'Session expired. Please login again.',
          'error',
        );

        /* =========================================
           REDIRECT TO LOGIN
        ========================================= */

        router.navigate(['/login']).finally(() => {

          isHandlingAuthError = false;
        });
      }

      return throwError(() => error);
    }),
  );
};