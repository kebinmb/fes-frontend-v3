import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';

import { selectAuthenticationState } from '../../../core/store/auth/auth.selector';

export const roleGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);
  const expectedRoles = route.data?.['role'];

  return store.select(selectAuthenticationState).pipe(
    filter((state) => state.isAuthChecked && !state.isLoading),
    map((state) => {
      if (!state.isAuthenticated || !state.role) {
        return router.createUrlTree(['/login']);
      }

      const userRoles = Array.isArray(state.role) ? state.role : [state.role];

      if (!expectedRoles) {
        return true;
      }

      const allowedRoles = Array.isArray(expectedRoles) ? expectedRoles : [expectedRoles];
      const hasRole = allowedRoles.some((role) => userRoles.includes(role));

      if (hasRole) {
        return true;
      }

      if (state.role === 'ROLE_HR') {
        return router.createUrlTree(['/admin-dashboard/supervisor-evaluations']);
      }

      return router.createUrlTree(['/login']);
    }),
  );
};
