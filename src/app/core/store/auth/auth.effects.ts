import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AuthService } from '../../services/auth/auth-service';
import { Router } from '@angular/router';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { ToastFacade } from '../toast/toast.facade';
import * as AuthActions from './auth.action';
import { catchError, exhaustMap, filter, map, of, tap } from 'rxjs';
import { extractErrorMessage } from '../../../utilities/extract-error.util';
@Injectable({
  providedIn: 'root',
})
export class AuthEffects {
  private actions$ = inject(Actions);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastFacade = inject(ToastFacade);
  private spinnerFacade = inject(SpinnerFacade);

  generateStudentAccessCode$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.generateAccessCodeForStudent),
      exhaustMap(({ evaluatorId }) => {
        this.spinnerFacade.showSpinner();
        return this.authService.generateStudentAccessCode(evaluatorId).pipe(
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
        tap(({ accessCode }) => {
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
        console.log('Login Student');
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
        tap(({ evaluatorId, role, accessCode }) => {
          this.toastFacade.showToast(`Login successful`, 'success');
          this.spinnerFacade.hideSpinner();
          this.router.navigate(['/student-dashboard']);
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
          tap((response: any) => {
            sessionStorage.setItem('college', response.college);
          }),
          map((response: any) => {
            this.spinnerFacade.hideSpinner();
            return AuthActions.supervisorLoginSuccess({
              evaluatorId: response.evaluatorId,
              role: 'ROLE_DEAN',
              college: response.college
            });
          }),
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
        tap(({ evaluatorId }) => {
          this.toastFacade.showToast(`Login successful`, 'success');
          this.router.navigate(['/supervisor-dashboard']);
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

  checkLoggedInUserAuthentication$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.checkLoggedInUserAuthentication),

      filter(() => !this.router.url.includes('/login')),

      exhaustMap(() =>
        this.authService.getCurrentUser().pipe(
          tap((res) => console.log('CHECK AUTHENTICATION RESPONSE:', res)),

          map((response: any) =>
            AuthActions.checkLoggedInUserAuthenticationSuccess({
              evaluatorId: response.userId, // 🔥 verify this field
              role: response.role,
              college: response.college
            }),
          ),

          catchError((error) => of(AuthActions.checkLoggedInUserAuthenticationFailure({ error }))),
        ),
      ),
    ),
  );

  checkLoggedInUserAuthenticationFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.checkLoggedInUserAuthenticationFailure),
        filter(() => !this.router.url.includes('/login')), // 🔥 condition here
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
          this.authService.logout();
          this.toastFacade.showToast(`Logged out successfully`, 'success');
          this.router.navigate(['/login']);
        }),
      ),
    { dispatch: false },
  );
}
