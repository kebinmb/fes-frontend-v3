import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  GuardResult,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';

import { AuthState } from '../../../core/store/auth/auth.state';
import { roleGuard } from './role-guard';

describe('roleGuard', () => {
  const loginTree = {} as UrlTree;
  const authState$ = new BehaviorSubject<AuthState>({
    evaluatorId: 'user-1',
    role: 'ROLE_ADMIN',
    isAuthenticated: true,
    isLoading: false,
    isAuthChecked: true,
    error: null,
    accessCode: null,
    accessCodeSent: false,
    college: null,
  });

  const router = {
    createUrlTree: vi.fn(() => loginTree),
  };

  function executeGuard(data: Record<string, unknown>) {
    const route = { data } as unknown as ActivatedRouteSnapshot;
    const state = {} as RouterStateSnapshot;

    return TestBed.runInInjectionContext(() => roleGuard(route, state)) as Observable<GuardResult>;
  }

  beforeEach(() => {
    router.createUrlTree.mockClear();
    authState$.next({
      evaluatorId: 'user-1',
      role: 'ROLE_ADMIN',
      isAuthenticated: true,
      isLoading: false,
      isAuthChecked: true,
      error: null,
      accessCode: null,
      accessCodeSent: false,
      college: null,
    });

    TestBed.configureTestingModule({
      providers: [
        {
          provide: Store,
          useValue: {
            select: vi.fn(() => authState$.asObservable()),
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    });
  });

  it('allows an authenticated user with the expected role', async () => {
    await expect(firstValueFrom(executeGuard({ role: 'ROLE_ADMIN' }))).resolves.toBe(true);
    expect(router.createUrlTree).not.toHaveBeenCalled();
  });

  it('allows an authenticated user when their role is in the allowed list', async () => {
    authState$.next({
      ...authState$.value,
      role: 'ROLE_PROGRAM_CHAIR',
    });

    await expect(
      firstValueFrom(executeGuard({ role: ['ROLE_DEAN', 'ROLE_PROGRAM_CHAIR'] })),
    ).resolves.toBe(true);
  });

  it('redirects unauthenticated users to login', async () => {
    authState$.next({
      ...authState$.value,
      role: null,
      isAuthenticated: false,
    });

    await expect(firstValueFrom(executeGuard({ role: 'ROLE_ADMIN' }))).resolves.toBe(loginTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('redirects authenticated users with the wrong role to login', async () => {
    authState$.next({
      ...authState$.value,
      role: 'ROLE_STUDENT',
    });

    await expect(firstValueFrom(executeGuard({ role: 'ROLE_ADMIN' }))).resolves.toBe(loginTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });

  it('redirects HR users away from admin-only children to the faculty list', async () => {
    authState$.next({
      ...authState$.value,
      role: 'ROLE_HR',
    });

    await expect(firstValueFrom(executeGuard({ role: 'ROLE_ADMIN' }))).resolves.toBe(loginTree);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/admin-dashboard/faculty-list']);
  });
});
