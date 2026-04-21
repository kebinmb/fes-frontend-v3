import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthenticationState } from '../../../core/store/auth/auth.selector';
import { filter, map } from 'rxjs';

export const roleGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);
  const expectedRole = route.data?.['role'];

  return store.select(selectAuthenticationState).pipe(
    filter((state) => state.isAuthChecked && !state.isLoading),

    map((state) => {
      if (!state.isAuthenticated || !state.role) {
        return router.createUrlTree(['/login']);
      }

      if (expectedRole && state.role !== expectedRole) {
        return router.createUrlTree(['/login']);
      }

      return true;
    }),
  );
};