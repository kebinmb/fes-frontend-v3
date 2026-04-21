import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthenticationState } from '../../../core/store/auth/auth.selector';
import { filter, map, take } from 'rxjs';

export const roleGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);
  const expectedRole = route.data?.['role'];

  return store.select(selectAuthenticationState).pipe(
    filter((state) => !state.isLoading),
    take(1),
    map((state) => {
      if (!state?.role) {
        return router.createUrlTree(['/login']);
      }

      if (!expectedRole) {
        return true;
      }

      if (state.role === 'ROLE_STUDENT') {
        return router.createUrlTree(['/dashboard/student']);
      } else if (state.role === 'ROLE_DEAN') {
        return router.createUrlTree(['/dashboard/supervisor']);
      } else if (state.role === 'ROLE_ADMIN') {
        return router.createUrlTree(['/dashboard/admin']);
      }
      return router.createUrlTree(['/login']);
    }),
  );
};
