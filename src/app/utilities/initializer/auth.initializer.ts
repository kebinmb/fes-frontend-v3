import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthFacade } from '../../core/store/auth/auth.facade';
import { filter, firstValueFrom, skipWhile } from 'rxjs';

export function initializeAuth() {
  const router = inject(Router);
  const authFacade = inject(AuthFacade);
  return async () => {
    authFacade.checkLoggedInUserAuthentication();
    await firstValueFrom(
      authFacade.isLoading$.pipe(
        skipWhile((loading) => !loading),
        filter((loading) => !loading),
      ),
    );
    const isAuthenticated = await firstValueFrom(authFacade.isAuthenticated$);
    if (!isAuthenticated) {
      router.navigate(['/login']);
    }
  };
}
