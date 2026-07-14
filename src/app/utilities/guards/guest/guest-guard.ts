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

      if (!role) {
        return true;
      }

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

        case 'ROLE_HR':
          return router.createUrlTree([
            '/admin-dashboard/faculty-list',
          ]);

        default:
          return true;
      }
    }),
  );
};
