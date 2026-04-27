import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthenticationState } from '../../../core/store/auth/auth.selector';
import { filter, map, tap } from 'rxjs';

export const roleGuard: CanActivateFn = (route) => {
  const store = inject(Store);
  const router = inject(Router);
  const expectedRole = route.data?.['role'];

  return store.select(selectAuthenticationState).pipe(
    filter((state) => state.isAuthChecked && !state.isLoading),

    map((state) => {
      console.log('🔍 Auth State:', state);
      console.log('🔍 Expected Role:', expectedRole);

      if (!state.isAuthenticated || !state.role) {
        console.warn('❌ Not authenticated or role missing');
        return router.createUrlTree(['/login']);
      }

      // Normalize role (handles string or array)
      const userRoles = Array.isArray(state.role)
        ? state.role
        : [state.role];

      console.log('🔍 User Roles:', userRoles);

      if (expectedRole && !userRoles.includes(expectedRole)) {
        console.warn('❌ Role mismatch');
        return router.createUrlTree(['/login']);
      }

      console.log('✅ Access granted');
      return true;
    })
  );
};