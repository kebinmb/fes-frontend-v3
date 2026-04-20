import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AuthService } from "../../services/auth/auth-service";
import { Router } from "@angular/router";
import { SpinnerFacade } from "../spinner/spinner.facade";
import { ToastFacade } from "../toast/toast.facade";
import * as AuthActions from "./auth.action";
import { catchError, exhaustMap, map, of, tap } from "rxjs";
import { extractErrorMessage } from "../../../utilities/extract-error.util";
@Injectable({
    providedIn: 'root'
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
                        return of(AuthActions.generateAccessCodeForStudentFailure({
                            error: extractErrorMessage(error)
                        }));
                    })
                );
            })
        )
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
        () => this.actions$.pipe(
            ofType(AuthActions.generateAccessCodeForStudentFailure),
            tap(({ error }) => {
                this.toastFacade.showToast('Access code generation failed, please contact adminsitrator', 'error');
            }),
        ),
        { dispatch: false }
    )

    loginStudent$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.studentLogin),
            exhaustMap(({ evaluatorId, accessCode }) => {
                this.spinnerFacade.showSpinner()
                return this.authService.studentLogin(evaluatorId, accessCode).pipe(
                    map((response: any) => {
                        this.spinnerFacade.hideSpinner();
                        return AuthActions.studentLoginSuccess(
                            {
                                evaluatorId: response.evaluatorId,
                                accessCode: response.accessCode,
                                role: response.role
                            });
                    }),
                    catchError((error) => {
                        this.spinnerFacade.hideSpinner();
                        return of(AuthActions.studentLoginFailure({
                            error: extractErrorMessage(error)
                        }));
                    })
                );
            })
        )
    );

    loginStudentSuccess$ = createEffect(() =>
        this.actions$.pipe(
            ofType(AuthActions.studentLoginSuccess),
            tap(({ evaluatorId, role, accessCode }) => {
                this.toastFacade.showToast(`Login successful for ${evaluatorId}`, 'success');
            }),
        ),
        { dispatch: false }
    )

    loginStudentFailure$ = createEffect(() => this.actions$.pipe(
        ofType(AuthActions.studentLoginFailure),
        tap(({ error }) => {
            this.toastFacade.showToast(`Login failed ${error}`, 'error');
        })
    ))

}