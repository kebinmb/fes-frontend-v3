import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthService } from '../../services/auth/auth-service';
import { Router } from '@angular/router';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { ToastFacade } from '../toast/toast.facade';
import * as AuthActions from './auth.action';
import { catchError, exhaustMap, filter, map, of, tap } from 'rxjs';
import { extractErrorMessage } from '../../../utilities/extract-error.util';
import { Store } from '@ngrx/store';
import { resetEvaluationState } from '../evaluation-data/evaluation.action';
import { resetStudentState } from '../student-data/student-data.action';
import { resetSupervisorState } from '../supervisor-data/supervisor-data.actions';

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
          map((response: any) => {
            this.spinnerFacade.hideSpinner();
            return AuthActions.generateAccessCodeForStudentSuccess({
              accessCode: response.accessCode,
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
          this.toastFacade.showToast('Access Code Generated', 'success');
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
          tap((res) => console.log('LOGIN RESPONSE:', res)),
          map((response: any) => {
            this.spinnerFacade.hideSpinner();
            return AuthActions.studentLoginSuccess({
              evaluatorId: response.studentId,
              accessCode: response.accessCode,
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
          this.toastFacade.showToast(`Login successful`, 'success');
          this.spinnerFacade.hideSpinner();
          Promise.resolve().then(() => this.router.navigate(['/student-dashboard']));
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

        map(() =>
          AuthActions.checkLoggedInUserAuthentication()
        ),

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
          this.toastFacade.showToast(`Login successful`, 'success');
          Promise.resolve().then(() => this.router.navigate(['/supervisor-dashboard']));
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
          tap((response: any) => {
            sessionStorage.setItem('college', response.college);
          }),
          map((response: any) => {
            this.spinnerFacade.hideSpinner();
            return AuthActions.administratorLoginSuccess({
              administratorId: response.administratorId,
              role: 'ROLE_ADMIN',
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
        tap(() => {
          this.toastFacade.showToast(`Login successful`, 'success');
          Promise.resolve().then(() => this.router.navigate(['/admin-dashboard']));
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
          tap((response) => console.log('CHECK AUTHENTICATION RESPONSE:', response)),

          map((response: any) => {
            const resolvedUserId =
              response.studentId ??
              response.userId ??
              response.administratorId ??
              response.evaluatorId ??
              null;

            return AuthActions.checkLoggedInUserAuthenticationSuccess({
              evaluatorId: resolvedUserId,

              role: response.role,

              college: response.college ?? null,
              program: response.program
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

      map((response: any) => {

        if (
          response.role === 'ROLE_DEAN' ||
          response.role === 'ROLE_PROGRAM_CHAIR'
        ) {

          return this.handleSupervisorLoginSuccess(response);
        }

        if (response.role === 'ROLE_ADMIN') {

          return AuthActions.administratorLoginSuccess({
            administratorId: response.evaluatorId,
            role: 'ROLE_ADMIN',
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
        tap(() => {
          this.store.dispatch(resetStudentState());
          this.store.dispatch(resetSupervisorState());
          this.store.dispatch(resetEvaluationState());
          localStorage.clear();
          sessionStorage.clear();
          this.authService.logout();
          this.toastFacade.showToast(`Logged out successfully`, 'success');
          this.router.navigate(['/login']);
        }),
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
    response: any,
  ) {

    sessionStorage.setItem('college', response.college);

    sessionStorage.setItem('program', response.program);

    this.spinnerFacade.hideSpinner();

    return AuthActions.supervisorLoginSuccess({
      evaluatorId: response.evaluatorId,
      role: response.role,
      college: response.college,
      program: response.program,
    });
  }
}
