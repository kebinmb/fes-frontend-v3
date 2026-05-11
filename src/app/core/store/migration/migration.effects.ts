import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as MigrationActions from './migration.actions';
import { catchError, exhaustMap, map, of, tap } from 'rxjs';
import { ToastFacade } from '../toast/toast.facade';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { extractErrorMessage } from '../../../utilities/extract-error.util';
import { AdminService } from '../../services/admin/admin-service';

@Injectable({
    providedIn: 'root',
})
export class MigrationEffects {

    private actions$ = inject(Actions);
    private migrationService = inject(AdminService);
    private toastFacade = inject(ToastFacade);
    private spinnerFacade = inject(SpinnerFacade);

    migrateAll$ = createEffect(() =>
        this.actions$.pipe(

            ofType(MigrationActions.migrateAll),

            exhaustMap(() => {

                this.spinnerFacade.showSpinner();

                return this.migrationService.migrateAll().pipe(

                    map((response) => {

                        this.spinnerFacade.hideSpinner();

                        return MigrationActions.migrateAllSuccess({
                            response,
                        });
                    }),

                    catchError((error) => {

                        this.spinnerFacade.hideSpinner();

                        return of(
                            MigrationActions.migrateAllFailure({
                                error: extractErrorMessage(error),
                            }),
                        );
                    }),
                );
            }),
        ),
    );

    migrateAllSuccess$ = createEffect(
        () =>
            this.actions$.pipe(

                ofType(MigrationActions.migrateAllSuccess),

                tap(({ response }) => {

                    this.toastFacade.showToast(
                        response.message || 'Migration started successfully',
                        'success',
                    );
                }),
            ),
        { dispatch: false },
    );

    migrateAllFailure$ = createEffect(
        () =>
            this.actions$.pipe(

                ofType(MigrationActions.migrateAllFailure),

                tap(({ error }) => {

                    this.toastFacade.showToast(
                        error,
                        'error',
                    );
                }),
            ),
        { dispatch: false },
    );
}