import { inject } from '@angular/core';

import {
  CanActivateFn,
  Router,
} from '@angular/router';

import { map, take } from 'rxjs/operators';

import { AuthFacade } from '../../../core/store/auth/auth.facade';

export const guestGuard: CanActivateFn = () => {

  const router = inject(Router);

  const authFacade = inject(AuthFacade);

  return authFacade.role$.pipe(

    take(1),

    map((role) => {

      /* =========================================
         NOT LOGGED IN
      ========================================= */

      if (!role) {
        return true;
      }

      /* =========================================
         REDIRECT BASED ON ROLE
      ========================================= */

      switch (role) {

        case 'ROLE_STUDENT':
          return router.createUrlTree([
            '/student-dashboard',
          ]);

        case 'ROLE_DEAN':
          return router.createUrlTree([
            '/supervisor-dashboard',
          ]);

        case 'ROLE_ADMIN':
          return router.createUrlTree([
            '/admin-dashboard',
          ]);

        default:
          return true;
      }
    }),
  );
};