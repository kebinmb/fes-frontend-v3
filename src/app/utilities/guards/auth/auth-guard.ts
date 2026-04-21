import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthenticationState } from '../../../core/store/auth/auth.selector';
import { filter, map, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const store = inject(Store);
  const router = inject(Router);

  return store.select(selectAuthenticationState).pipe(
    filter((state) => !state.isLoading),
    take(1),
    map((state) => {
      if (state.isAuthenticated) {
        return true;
      }

      return router.createUrlTree(['/login']);
    }),
  );
};
