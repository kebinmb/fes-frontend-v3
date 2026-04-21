import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { selectAuthenticationState } from '../../../core/store/auth/auth.selector';
import { filter, map, tap } from 'rxjs';
import { AuthFacade } from '../../../core/store/auth/auth.facade';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  const authFacade = inject(AuthFacade);

  return store.select(selectAuthenticationState).pipe(
    tap((state) => {
      if (!state.isAuthChecked && !state.isLoading) {
        authFacade.checkLoggedInUserAuthentication();
      }
    }),
    filter((state) => state.isAuthChecked && !state.isLoading),
    map((state) => {
      if (state.isAuthenticated) {
        return true;
      }
      return router.createUrlTree(['/login']);
    }),
  );
};