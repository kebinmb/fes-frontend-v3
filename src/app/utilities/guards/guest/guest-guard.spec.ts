import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

import { guestGuard } from './guest-guard';
import { AuthFacade } from '../../../core/store/auth/auth.facade';
import { AuthState } from '../../../core/store/auth/auth.state';

describe('guestGuard', () => {
  const dashboardTree = {} as UrlTree;
  const role$ = new BehaviorSubject<AuthState['role']>(null);
  const router = {
    createUrlTree: vi.fn(() => dashboardTree),
  };

  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => guestGuard(...guardParameters));

  beforeEach(() => {
    router.createUrlTree.mockClear();
    role$.next(null);

    TestBed.configureTestingModule({
      providers: [
        {
          provide: AuthFacade,
          useValue: {
            role$: role$.asObservable(),
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });

  it('allows guests to open the login page', async () => {
    await expect(firstValueFrom(runGuard())).resolves.toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('redirects program chairs to the supervisor dashboard', async () => {
    role$.next('ROLE_PROGRAM_CHAIR');

    await expect(firstValueFrom(runGuard())).resolves.toBe(dashboardTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/supervisor-dashboard']);
  });

  it('redirects HR users to the faculty list', async () => {
    role$.next('ROLE_HR');

    await expect(firstValueFrom(runGuard())).resolves.toBe(dashboardTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin-dashboard/faculty-list']);
  });

  function runGuard(): Observable<boolean | UrlTree> {
    return executeGuard(
      {} as ActivatedRouteSnapshot,
      {} as RouterStateSnapshot,
    ) as Observable<boolean | UrlTree>;
  }
});
