import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { AdminService } from '../../services/admin/admin-service';
import { mergeMap, map, catchError, of, tap } from 'rxjs';
import * as AdminDataActions from './admin-data.actions';
@Injectable({
  providedIn: 'root',
})
export class AdminEffects {
  private actions$ = inject(Actions);
  private adminDataService = inject(AdminService);

  loadFaculties$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadFaculties),

      mergeMap(({ page, size, search }) =>
        this.adminDataService.getFaculties(page, size, search ?? '').pipe(
          tap((response) => console.log('FACULTIES RESPONSE', response)),

          map((response) =>
            AdminDataActions.loadFacultiesSuccess({
              response,
            }),
          ),

          catchError((error) =>
            of(
              AdminDataActions.loadFacultiesFailure({
                error,
              }),
            ),
          ),
        ),
      ),
    ),
  );

  loadUserAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadUserAccounts),
      mergeMap(({ page, size }) =>
        this.adminDataService.getUserAccounts(page, size).pipe(
          tap((response) => console.log('FACULTIES RESPONSE', response)),
          map((response) => AdminDataActions.loadUserAccountsSuccess({ response })),
          catchError((error) => of(AdminDataActions.loadUserAccountsFailure({ error }))),
        ),
      ),
    ),
  );

  loadFacultyEvaluationScores$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.loadFacultyEvaluationScores),
      mergeMap(({ page, size }) =>
        this.adminDataService.getFacultyEvaluationScores(page, size).pipe(
          tap((response) => console.log('FACULTIES RESPONSE', response)),
          map((response) => AdminDataActions.loadFacultyEvaluationScoresSuccess({ response })),
          catchError((error) => of(AdminDataActions.loadFacultyEvaluationScoresFailure({ error }))),
        ),
      ),
    ),
  );

  updateFaculty$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminDataActions.updateFaculty),

      mergeMap(({ payload }) =>
        this.adminDataService.updateFaculty(payload).pipe(
          tap((response) => console.log('UPDATE FACULTY RESPONSE', response)),

          mergeMap((response) => [
            AdminDataActions.updateFacultySuccess({ response }),

            AdminDataActions.loadFaculties({
              page: 0,
              size: 10,
              search: '',
            }),
          ]),

          catchError((error) =>
            of(
              AdminDataActions.updateFacultyFailure({
                error,
              }),
            ),
          ),
        ),
      ),
    ),
  );
}
