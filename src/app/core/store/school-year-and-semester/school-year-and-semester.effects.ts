import { inject, Injectable } from '@angular/core';

import {
    Actions,
    createEffect,
    ofType,
} from '@ngrx/effects';

import {
    catchError,
    exhaustMap,
    map,
    of,
    tap,
} from 'rxjs';

import * as SchoolYearAndSemesterActions
    from './school-year-and-semester.actions';



import { ToastFacade }
    from '../toast/toast.facade';
import { AdminService } from '../../services/admin/admin-service';

@Injectable({
    providedIn: 'root',
})
export class SchoolYearAndSemesterEffects {

    private actions$ = inject(Actions);

    private service =
        inject(AdminService);

    private toastFacade =
        inject(ToastFacade);

    updateSchoolYearAndSemester$ =
        createEffect(() =>

            this.actions$.pipe(

                ofType(
                    SchoolYearAndSemesterActions
                        .updateSchoolYearAndSemester,
                ),

                exhaustMap(({
                    schoolYear,
                    semester,
                }) =>

                    this.service
                        .updateSchoolYearAndSemester(
                            schoolYear,
                            semester,
                        )
                        .pipe(

                            map((response) =>

                                SchoolYearAndSemesterActions
                                    .updateSchoolYearAndSemesterSuccess({
                                        response,
                                    }),
                            ),

                            catchError((error) =>

                                of(
                                    SchoolYearAndSemesterActions
                                        .updateSchoolYearAndSemesterFailure({
                                            error,
                                        }),
                                ),
                            ),
                        ),
                ),
            ),
        );

    updateSuccess$ = createEffect(
        () =>

            this.actions$.pipe(

                ofType(
                    SchoolYearAndSemesterActions
                        .updateSchoolYearAndSemesterSuccess,
                ),

                tap(() => {

                    this.toastFacade.showToast(
                        'School year and semester updated successfully.',
                        'success',
                    );
                }),
            ),

        { dispatch: false },
    );

    updateFailure$ = createEffect(
        () =>

            this.actions$.pipe(

                ofType(
                    SchoolYearAndSemesterActions
                        .updateSchoolYearAndSemesterFailure,
                ),

                tap(({ error }) => {

                    this.toastFacade.showToast(
                        error?.error ||
                        'Failed to update school year and semester.',
                        'error',
                    );
                }),
            ),

        { dispatch: false },
    );
    fetchCurrentSchoolYearAndSemester$ =
  createEffect(() =>

    this.actions$.pipe(

      ofType(
        SchoolYearAndSemesterActions
          .fetchCurrentSchoolYearAndSemester,
      ),

      exhaustMap(() =>

        this.service
          .fetchCurrentSchoolYearAndSemester()
          .pipe(

            map((response) =>

              SchoolYearAndSemesterActions
                .fetchCurrentSchoolYearAndSemesterSuccess({
                  response,
                }),
            ),

            catchError((error) =>

              of(
                SchoolYearAndSemesterActions
                  .fetchCurrentSchoolYearAndSemesterFailure({
                    error,
                  }),
              ),
            ),
          ),
      ),
    ),
  );
}