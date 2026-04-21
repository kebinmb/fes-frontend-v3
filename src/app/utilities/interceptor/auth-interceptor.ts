import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastFacade } from '../../core/store/toast/toast.facade';
let isHandlingAuthError = false;
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const toastFacade = inject(ToastFacade);
  const router = inject(Router);
  const cloned = req.clone({
    withCredentials: true,
  });

  if (req.url.includes('/auth/login')) {
    return next(req);
  }

  return next(cloned).pipe(
    catchError((error) => {
      if (error?.status === 401) {
        if (!router.url.includes('/login') && !isHandlingAuthError) {
          isHandlingAuthError = true;

          toastFacade.showToast('Session expired. Please login again.', 'error');

          router.navigate(['/login']).finally(() => {
            isHandlingAuthError = false;
          });
        }
      }
      if (error?.status === 403) {
        alert('Forbidden');
      }
      return throwError(() => error);
    }),
  );
};
