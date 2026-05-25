import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { Store } from '@ngrx/store';

import * as AuthActions from './../../core/store/auth/auth.action';

let isHandlingAuthError = false;

export const authInterceptor: HttpInterceptorFn = (
  req,
  next,
) => {

  const router = inject(Router);

  const store = inject(Store);

  const cloned = req.clone({
    withCredentials: true,
  });

  return next(cloned).pipe(

    catchError((error) => {

      const isAuthRequest =

        req.url.includes('/auth/student/login') ||

        req.url.includes('/auth/supervisor/login') ||

        req.url.includes('/auth/administrator/login') ||

        req.url.includes('/auth/access-code/generate');

      // Allow login page to handle its own errors
      if (isAuthRequest) {

        return throwError(() => error);
      }

      // Session expired
      if (
        error?.status === 401 ||
        error?.status === 403
      ) {

        store.dispatch(
          AuthActions.sessionExpired()
        );
      }

      return throwError(() => error);
    }),
  );
};