import {
  inject,
  Injectable,
} from '@angular/core';

import {
  Actions,
  createEffect,
  ofType,
} from '@ngrx/effects';

import {
  catchError,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
} from 'rxjs';

import * as AdminDataActions
from './admin-data.actions';

import { AdminService }
from '../../services/admin/admin-service';

import { ToastFacade }
from '../toast/toast.facade';

import { extractErrorMessage }
from '../../../utilities/extract-error.util';

@Injectable({
  providedIn: 'root',
})
export class AdminEffects {

  private actions$ =
    inject(Actions);

  private adminDataService =
    inject(AdminService);

  private toastFacade =
    inject(ToastFacade);

  loadFaculties$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        AdminDataActions.loadFaculties
      ),

      mergeMap(({
        page,
        size,
        search,
      }) =>

        this.adminDataService
          .getFaculties(
            page,
            size,
            search ?? '',
          )

          .pipe(

            map((response) =>

              AdminDataActions
                .loadFacultiesSuccess({
                  response,
                })

            ),

            catchError((error) => {

              this.toastFacade.showToast(
                extractErrorMessage(error),
                'error',
              );

              return of(

                AdminDataActions
                  .loadFacultiesFailure({
                    error,
                  })

              );
            }),
          ),
      ),
    ),
  );

  loadUserAccounts$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        AdminDataActions.loadUserAccounts
      ),

      mergeMap(({
        page,
        size,
      }) =>

        this.adminDataService
          .getUserAccounts(
            page,
            size,
          )

          .pipe(

            map((response) =>

              AdminDataActions
                .loadUserAccountsSuccess({
                  response,
                })

            ),

            catchError((error) => {

              this.toastFacade.showToast(
                extractErrorMessage(error),
                'error',
              );

              return of(

                AdminDataActions
                  .loadUserAccountsFailure({
                    error,
                  })

              );
            }),
          ),
      ),
    ),
  );

  loadFacultyEvaluationScores$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        AdminDataActions
          .loadFacultyEvaluationScores
      ),

      mergeMap(({
        page,
        size,
      }) =>

        this.adminDataService
          .getFacultyEvaluationScores(
            page,
            size,
          )

          .pipe(

            map((response) =>

              AdminDataActions
                .loadFacultyEvaluationScoresSuccess({
                  response,
                })

            ),

            catchError((error) => {

              this.toastFacade.showToast(
                extractErrorMessage(error),
                'error',
              );

              return of(

                AdminDataActions
                  .loadFacultyEvaluationScoresFailure({
                    error,
                  })

              );
            }),
          ),
      ),
    ),
  );

  loadFacultyEvaluationScoresByFacultyId$ =
    createEffect(() =>

      this.actions$.pipe(

        ofType(
          AdminDataActions
            .loadFacultyEvaluationScoresByFacultyId
        ),

        switchMap(({
          facultyId,
        }) =>

          this.adminDataService
            .getFacultyEvaluationScoresByFacultyId(
              facultyId
            )

            .pipe(

              tap((response) => {

                if (!response?.length) {

                  this.toastFacade.showToast(
                    'No faculty evaluation records found.',
                    'error',
                  );

                  return;
                }

                this.toastFacade.showToast(
                  'Faculty evaluation records loaded successfully.',
                  'success',
                );
              }),

              map((response) =>

                AdminDataActions
                  .loadFacultyEvaluationScoresByFacultyIdSuccess({
                    response,
                  })

              ),

              catchError((error) => {

                this.toastFacade.showToast(
                  extractErrorMessage(error),
                  'error',
                );

                return of(

                  AdminDataActions
                    .loadFacultyEvaluationScoresByFacultyIdFailure({
                      error,
                    })

                );
              }),
            ),
        ),
      ),
    );

  updateFaculty$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        AdminDataActions.updateFaculty
      ),

      mergeMap(({
        payload,
      }) =>

        this.adminDataService
          .updateFaculty(payload)

          .pipe(

            tap(() => {

              this.toastFacade.showToast(
                'Faculty updated successfully.',
                'success',
              );
            }),

            mergeMap((response) => [

              AdminDataActions
                .updateFacultySuccess({
                  response,
                }),

              AdminDataActions
                .loadFaculties({
                  page: 0,
                  size: 10,
                  search: '',
                }),
            ]),

            catchError((error) => {

              this.toastFacade.showToast(
                extractErrorMessage(error),
                'error',
              );

              return of(

                AdminDataActions
                  .updateFacultyFailure({
                    error,
                  })

              );
            }),
          ),
      ),
    ),
  );

  createUserAccount$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        AdminDataActions
          .createUserAccount
      ),

      mergeMap(({
        payload,
      }) =>

        this.adminDataService
          .createUserAccount(payload)

          .pipe(

            tap(() => {

              this.toastFacade.showToast(
                'User account created successfully.',
                'success',
              );
            }),

            mergeMap((response) => [

              AdminDataActions
                .createUserAccountSuccess({
                  response,
                }),

              AdminDataActions
                .loadUserAccounts({
                  page: 0,
                  size: 10,
                }),
            ]),

            catchError((error) => {

              this.toastFacade.showToast(
                extractErrorMessage(error),
                'error',
              );

              return of(

                AdminDataActions
                  .createUserAccountFailure({
                    error,
                  })

              );
            }),
          ),
      ),
    ),
  );

  updateUserAccount$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        AdminDataActions
          .updateUserAccount
      ),

      mergeMap(({
        payload,
      }) =>

        this.adminDataService
          .updateUserAccount(payload)

          .pipe(

            tap(() => {

              this.toastFacade.showToast(
                'User account updated successfully.',
                'success',
              );
            }),

            mergeMap((response) => [

              AdminDataActions
                .updateUserAccountSuccess({
                  response,
                }),

              AdminDataActions
                .loadUserAccounts({
                  page: 0,
                  size: 10,
                }),
            ]),

            catchError((error) => {

              this.toastFacade.showToast(
                extractErrorMessage(error),
                'error',
              );

              return of(

                AdminDataActions
                  .updateUserAccountFailure({
                    error,
                  })

              );
            }),
          ),
      ),
    ),
  );

  updateUserPassword$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        AdminDataActions
          .updateUserPassword
      ),

      mergeMap(({
        payload,
      }) =>

        this.adminDataService
          .updateUserPassword(payload)

          .pipe(

            tap(() => {

              this.toastFacade.showToast(
                'Password updated successfully.',
                'success',
              );
            }),

            map((response) =>

              AdminDataActions
                .updateUserPasswordSuccess({
                  response,
                })

            ),

            catchError((error) => {

              this.toastFacade.showToast(
                extractErrorMessage(error),
                'error',
              );

              return of(

                AdminDataActions
                  .updateUserPasswordFailure({
                    error,
                  })

              );
            }),
          ),
      ),
    ),
  );
}