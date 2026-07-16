import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import {
  AuthService,
  CurrentUserResponse,
} from '../../services/auth/auth-service';
import { Router } from '@angular/router';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { ToastFacade } from '../toast/toast.facade';
import * as AuthActions from './auth.action';
import { catchError, EMPTY, exhaustMap, filter, map, of, switchMap, tap } from 'rxjs';
import { extractErrorMessage } from '../../../utilities/extract-error.util';
import { Store } from '@ngrx/store';
import { resetEvaluationState } from '../evaluation-data/evaluation.action';
import { resetStudentState } from '../student-data/student-data.action';
import { resetSupervisorState } from '../supervisor-data/supervisor-data.actions';

type SupervisorCurrentUserResponse = CurrentUserResponse & {
  evaluatorId: string;
  role: 'ROLE_DEAN' | 'ROLE_PROGRAM_CHAIR';
};

@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastFacade = inject(ToastFacade);
  private spinnerFacade = inject(SpinnerFacade);
  private store = inject(Store);
  generateStudentAccessCode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.generateAccessCodeForStudent),
      exhaustMap(({ evaluatorId, password }) => {
        this.spinnerFacade.showSpinner();
        return this.authService.generateStudentAccessCode(evaluatorId, password).pipe(
          map((response) => {
            this.spinnerFacade.hideSpinner();
            return AuthActions.generateAccessCodeForStudentSuccess({
              expiresAt: response.expiresAt,
            });
          }),
          catchError((error) => {
            this.spinnerFacade.hideSpinner();
            return of(
              AuthActions.generateAccessCodeForStudentFailure({
                error: extractErrorMessage(error),
              }),
            );
          }),
        );
      }),
    ),
  );
  generateAccessCodeSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.generateAccessCodeForStudentSuccess),
        tap(() => {
          this.toastFacade.showToast(
            'Your access code has been sent successfully. Please check your inbox. If you don’t see it, check your Spam or Junk folder.',
            'success'
          );
        }),
      ),
    { dispatch: false },
  );
  generateAccessCodeFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.generateAccessCodeForStudentFailure),
        tap(({ error }) => {
          this.toastFacade.showToast(`${error}`, 'error');
        }),
      ),
    { dispatch: false },
  );
  loginStudent$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.studentLogin),
      exhaustMap(({ evaluatorId, accessCode }) => {
        this.spinnerFacade.showSpinner();

        return this.authService.studentLogin(evaluatorId, accessCode).pipe(
          map((response) => {
            this.spinnerFacade.hideSpinner();
            return AuthActions.studentLoginSuccess({
              evaluatorId: response.studentId,
              accessCode,
              role: 'ROLE_STUDENT',
            });
          }),
          catchError((error) => {
            this.spinnerFacade.hideSpinner();
            return of(
              AuthActions.studentLoginFailure({
                error: extractErrorMessage(error),
              }),
            );
          }),
        );
      }),
    ),
  );
  loginStudentSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.studentLoginSuccess),
        tap(() => {
          if (this.shouldAnnounceLoginSuccess('/login')) {
            this.toastFacade.showToast(`Login successful`, 'success');
          }

          this.spinnerFacade.hideSpinner();

          if (this.shouldNavigateAfterLogin('/student-dashboard')) {
            Promise.resolve().then(() => this.router.navigate(['/student-dashboard']));
          }
        }),
      ),
    { dispatch: false },
  );
  loginStudentFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.studentLoginFailure),
        tap(({ error }) => {
          this.toastFacade.showToast(`Login failed ${error}`, 'error');
        }),
      ),
    { dispatch: false },
  );
  loginSupervisor$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.supervisorLogin),

      exhaustMap(({ username, password }) => {
        this.spinnerFacade.showSpinner();

        return this.authService.supervisorLogin(username, password).pipe(
          map(() => AuthActions.checkLoggedInUserAuthentication()),

          catchError((error) => {
            this.spinnerFacade.hideSpinner();

            return of(
              AuthActions.supervisorLoginFailure({
                error: extractErrorMessage(error),
              }),
            );
          }),
        );
      }),
    ),
  );
  loginSupervisorSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.supervisorLoginSuccess),
        tap(() => {
          if (this.shouldAnnounceLoginSuccess('/login')) {
            this.toastFacade.showToast(`Login successful`, 'success');
          }

          if (this.shouldNavigateAfterLogin('/supervisor-dashboard')) {
            Promise.resolve().then(() => this.router.navigate(['/supervisor-dashboard']));
          }
        }),
      ),
    { dispatch: false },
  );

  loginSupervisorFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.supervisorLoginFailure),
        tap(({ error }) => {
          this.toastFacade.showToast(`${error}`, 'error');
        }),
      ),
    { dispatch: false },
  );
  loginAdmin$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.administratorLogin),
      exhaustMap(({ username, password }) => {
        this.spinnerFacade.showSpinner();

        return this.authService.administratorLogin(username, password).pipe(
          tap((response) => {
            sessionStorage.setItem('college', response.college ?? '');
          }),
          map((response) => {
            this.spinnerFacade.hideSpinner();
            return AuthActions.administratorLoginSuccess({
              administratorId: response.administratorId,
              role: response.role === 'ROLE_HR' ? 'ROLE_HR' : 'ROLE_ADMIN',
            });
          }),
          catchError((error) => {
            this.spinnerFacade.hideSpinner();
            return of(
              AuthActions.administratorLoginFailure({
                error: extractErrorMessage(error),
              }),
            );
          }),
        );
      }),
    ),
  );
  loginAdministratorSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.administratorLoginSuccess),
        tap(({ role }) => {
          if (this.shouldAnnounceLoginSuccess('/admin')) {
            this.toastFacade.showToast(`Login successful`, 'success');
          }

          const targetRoute =
            role === 'ROLE_HR'
              ? '/admin-dashboard/faculty-list'
              : '/admin-dashboard';

          if (this.shouldNavigateAfterLogin(targetRoute)) {
            Promise.resolve().then(() => this.router.navigate([targetRoute]));
          }
        }),
      ),
    { dispatch: false },
  );
  loginAdministratorFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.administratorLoginFailure),
        tap(({ error }) => {
          this.toastFacade.showToast(`${error}`, 'error');
        }),
      ),
    { dispatch: false },
  );
  checkLoggedInUserAuthentication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkLoggedInUserAuthentication),

      // filter(() => !this.router.url.includes('/login')),

      exhaustMap(() =>
        this.authService.getCurrentUser().pipe(
          map((response) => {
            const resolvedUserId =
              response.studentId ??
              response.userId ??
              response.administratorId ??
              response.evaluatorId ??
              '';

            return AuthActions.checkLoggedInUserAuthenticationSuccess({
              evaluatorId: resolvedUserId,

              role: response.role,

              college: response.college ?? '',
              program: response.program ?? '',
              requiresPasswordChange:
                response.requiresPasswordChange ?? false,
            });
          }),

          catchError((error) =>
            of(
              AuthActions.checkLoggedInUserAuthenticationFailure({
                error,
              }),
            ),
          ),
        ),
      ),
    ),
  );
  checkLoggedInUserAuthenticationSuccess$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkLoggedInUserAuthenticationSuccess),

      map((response) => {
        if (response.role === 'ROLE_DEAN' || response.role === 'ROLE_PROGRAM_CHAIR') {
          return this.handleSupervisorLoginSuccess({
            ...response,
            evaluatorId: response.evaluatorId,
            role: response.role,
          });
        }

        if (response.role === 'ROLE_ADMIN' || response.role === 'ROLE_HR') {
          return AuthActions.administratorLoginSuccess({
            administratorId: response.evaluatorId,
            role: response.role,
          });
        }

        return AuthActions.studentLoginSuccess({
          evaluatorId: response.evaluatorId,
          accessCode: '',
          role: 'ROLE_STUDENT',
        });
      }),
    ),
  );
  checkLoggedInUserAuthenticationFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.checkLoggedInUserAuthenticationFailure),
        filter(() => !this.router.url.includes('/login')),
        tap(() => {
          this.toastFacade.showToast(`Authentication failed, contact administrator.`, 'error');
        }),
      ),
    { dispatch: false },
  );
  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),

        switchMap(() =>
          this.authService.logout().pipe(
            tap(() => {
              this.store.dispatch(resetStudentState());
              this.store.dispatch(resetSupervisorState());
              this.store.dispatch(resetEvaluationState());

              localStorage.clear();
              sessionStorage.clear();

              this.toastFacade.showToast('Logged out successfully', 'success');

              this.router.navigate(['/login']);
            }),

            catchError((error) => {
              return EMPTY;
            }),
          ),
        ),
      ),
    { dispatch: false },
  );
  sessionExpired$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.sessionExpired),
        tap(() => {
          this.store.dispatch(resetStudentState());
          this.store.dispatch(resetSupervisorState());
          this.store.dispatch(resetEvaluationState());
          localStorage.clear();
          sessionStorage.clear();
          this.toastFacade.showToast('Your session has expired. Please sign in again.', 'error');
          this.authService.logout().subscribe({
            error: () => { },
          });
          Promise.resolve().then(() => {
            this.router.navigate(['/login']);
          });
        }),
      ),
    { dispatch: false },
  );
  private handleSupervisorLoginSuccess(
    response: SupervisorCurrentUserResponse
  ) {

    sessionStorage.setItem(
      'college',
      response.college ?? ''
    );

    sessionStorage.setItem(
      'program',
      response.program ?? ''
    );

    sessionStorage.setItem(
      'requiresPasswordChange',
      String(response.requiresPasswordChange)
    );

    this.spinnerFacade.hideSpinner();

    return AuthActions.supervisorLoginSuccess({
      evaluatorId: response.evaluatorId,
      role: response.role,
      college: response.college ?? '',
      program: response.program ?? '',
    });
  }

  private shouldAnnounceLoginSuccess(loginRoute: string): boolean {
    const currentRoute = this.router.url.split('?')[0];

    return currentRoute === loginRoute || currentRoute === '/oauth-success';
  }

  private shouldNavigateAfterLogin(targetRoute: string): boolean {
    const currentRoute = this.router.url.split('?')[0];

    return (
      currentRoute !== targetRoute &&
      ['/login', '/admin', '/oauth-success'].includes(currentRoute)
    );
  }
}
