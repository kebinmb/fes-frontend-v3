import { inject, Injectable } from '@angular/core';

import { Actions, createEffect, ofType } from '@ngrx/effects';

import { catchError, finalize, map, mergeMap, of, switchMap, tap } from 'rxjs';

import * as AdminDataActions from './admin-data.actions';

import { AdminService } from '../../services/admin/admin-service';

import { ToastFacade } from '../toast/toast.facade';

import { extractErrorMessage } from '../../../utilities/extract-error.util';
import { SpinnerFacade } from '../spinner/spinner.facade';

@Injectable({
  providedIn: 'root',
})
export class AdminEffects {
  private actions$ = inject(Actions);

  private adminDataService = inject(AdminService);

  private toastFacade = inject(ToastFacade);
  private spinnerFacade = inject(SpinnerFacade);
  loadFaculties$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadFaculties),

      mergeMap(({ page, size, search, legacyDatabase }) =>
        this.adminDataService
          .getFaculties(page, size, search ?? '', legacyDatabase ?? '')

          .pipe(
            map((response) =>
              AdminDataActions.loadFacultiesSuccess({
                response,
              }),
            ),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.loadFacultiesFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );

  loadUserAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadUserAccounts),

      mergeMap(({ page, size }) =>
        this.adminDataService
          .getUserAccounts(page, size)

          .pipe(
            map((response) =>
              AdminDataActions.loadUserAccountsSuccess({
                response,
              }),
            ),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.loadUserAccountsFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );

  loadFacultyEvaluationScores$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadFacultyEvaluationScores),

      mergeMap(({ page, size }) =>
        this.adminDataService
          .getFacultyEvaluationScores(page, size)

          .pipe(
            map((response) =>
              AdminDataActions.loadFacultyEvaluationScoresSuccess({
                response,
              }),
            ),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.loadFacultyEvaluationScoresFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );

  loadFacultyEvaluationScoresByFacultyId$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadFacultyEvaluationScoresByFacultyId),

      switchMap(({ facultyId }) =>
        this.adminDataService
          .getFacultyEvaluationScoresByFacultyId(facultyId)

          .pipe(
            tap((response) => {
              if (!response?.length) {
                this.toastFacade.showToast('No faculty evaluation records found.', 'error');

                return;
              }

              this.toastFacade.showToast(
                'Faculty evaluation records loaded successfully.',
                'success',
              );
            }),

            map((response) =>
              AdminDataActions.loadFacultyEvaluationScoresByFacultyIdSuccess({
                response,
              }),
            ),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.loadFacultyEvaluationScoresByFacultyIdFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );

  updateFaculty$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.updateFaculty),

      mergeMap(({ payload }) =>
        this.adminDataService
          .updateFaculty(payload)

          .pipe(
            tap(() => {
              this.toastFacade.showToast('Faculty updated successfully.', 'success');
            }),

            mergeMap((response) => [
              AdminDataActions.updateFacultySuccess({
                response,
              }),

              AdminDataActions.loadFaculties({
                page: 0,
                size: 10,
                search: '',
              }),
            ]),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.updateFacultyFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );

  createUserAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.createUserAccount),

      mergeMap(({ payload }) =>
        this.adminDataService
          .createUserAccount(payload)

          .pipe(
            tap(() => {
              this.toastFacade.showToast('User account created successfully.', 'success');
            }),

            mergeMap((response) => [
              AdminDataActions.createUserAccountSuccess({
                response,
              }),

              AdminDataActions.loadUserAccounts({
                page: 0,
                size: 10,
              }),
            ]),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.createUserAccountFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );

  updateUserAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.updateUserAccount),

      mergeMap(({ payload }) =>
        this.adminDataService
          .updateUserAccount(payload)

          .pipe(
            tap(() => {
              this.toastFacade.showToast('User account updated successfully.', 'success');
            }),

            mergeMap((response) => [
              AdminDataActions.updateUserAccountSuccess({
                response,
              }),

              AdminDataActions.loadUserAccounts({
                page: 0,
                size: 10,
              }),
            ]),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.updateUserAccountFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );

  updateUserPassword$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.updateUserPassword),

      mergeMap(({ payload }) =>
        this.adminDataService
          .updateUserPassword(payload)

          .pipe(
            tap(() => {
              this.toastFacade.showToast('Password updated successfully.', 'success');
            }),

            map((response) =>
              AdminDataActions.updateUserPasswordSuccess({
                response,
              }),
            ),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.updateUserPasswordFailure({
                  error,
                }),
              );
            }),
          ),
      ),
    ),
  );
  loadStudentSections$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadStudentSections),

      tap(() => {
        this.spinnerFacade.showSpinner();
      }),

      switchMap(({ page, size, programCode, yearLevel, sectionCode }) =>
        this.adminDataService
          .getStudentSections(page, size, programCode, yearLevel, sectionCode)

          .pipe(
            tap((response) => {
              if (!response?.content?.length) {
                this.toastFacade.showToast('No student section evaluations found.', 'error');
              }
            }),

            map((response) =>
              AdminDataActions.loadStudentSectionsSuccess({
                response,
              }),
            ),

            catchError((error) => {
              const message = extractErrorMessage(error);

              if (
                message?.includes('aborted') ||
                message?.includes('Unknown Error') ||
                message?.includes('Http failure')
              ) {
                return of({
                  type: '[Admin] Ignored Cancelled Request',
                });
              }

              this.toastFacade.showToast(message, 'error');

              return of(
                AdminDataActions.loadStudentSectionsFailure({
                  error,
                }),
              );
            }),

            finalize(() => {
              this.spinnerFacade.hideSpinner();
            }),
          ),
      ),
    ),
  );
  loadStudentEvaluationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadStudentEvaluationStatus),

      tap(() => {
        this.spinnerFacade.showSpinner();
      }),

      switchMap(({ programCode, yearLevel, sectionCode }) =>
        this.adminDataService
          .getStudentEvaluationStatus(programCode, yearLevel, sectionCode)

          .pipe(
            tap((response) => {
              if (!response?.length) {
                this.toastFacade.showToast('No student evaluation status found.', 'error');
              }
            }),

            map((response) =>
              AdminDataActions.loadStudentEvaluationStatusSuccess({
                response,
              }),
            ),

            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');

              return of(
                AdminDataActions.loadStudentEvaluationStatusFailure({
                  error,
                }),
              );
            }),

            finalize(() => {
              this.spinnerFacade.hideSpinner();
            }),
          ),
      ),
    ),
  );
}
