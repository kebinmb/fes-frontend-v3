import { inject, Injectable } from '@angular/core';

import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import * as ActionsSet
from './supervisor-data.actions';

import * as SupervisorDataActions
from './supervisor-data.actions';

import {
  SupervisorDataService
} from '../../services/supervisor-data/supervisor-data-service';

import {
  EvaluationService
} from '../../services/evaluation/evaluation-service';

import { Store } from '@ngrx/store';

import { Router } from '@angular/router';

import {
  SpinnerFacade
} from '../spinner/spinner.facade';

import {
  ToastFacade
} from '../toast/toast.facade';

import {

  catchError,

  filter,

  finalize,

  map,

  of,

  switchMap,

  tap,

  withLatestFrom

} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SupervisorDataEffects {

  private actions$ = inject(Actions);

  private api = inject(
    SupervisorDataService
  );

  private evaluationDataService =
    inject(EvaluationService);

  private store = inject(Store);

  private router = inject(Router);

  private spinner = inject(
    SpinnerFacade
  );

  private toast = inject(
    ToastFacade
  );

  /* ================= HELPERS ================= */

  private buildEvaluationKey(

    classCode: string,

    subjectCode: string,

    yearLevel: string,

    semester: string,

    schoolYear: number

  ): string {

    return `${classCode}-${subjectCode}-${yearLevel}-${semester}-${schoolYear}`;

  }

  /* ================= FACULTIES ================= */

  loadFaculties$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        ActionsSet.loadFaculties
      ),

      switchMap(({

        key,

        program,

        userId,

        page,

        size,

        sort,

        search

      }) => {

        this.spinner.showSpinner();

        return this.api
          .getFacultyLoadsByProgram(

            program,

            userId,

            page,

            size,

            sort,

            search

          )
          .pipe(

            map(response =>

              ActionsSet
                .loadFacultiesSuccess({

                  key,

                  response

                })

            ),

            catchError(error => {

              this.toast.showToast(
                'Failed to load faculties',
                'error'
              );

              return of(

                ActionsSet
                  .loadFacultiesFailure({

                    key,

                    error

                  })

              );

            }),

            finalize(() =>
              this.spinner.hideSpinner()
            )

          );

      })

    )

  );

  /* ================= FACULTY CLASSES ================= */

  loadFacultyClasses$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        ActionsSet.loadFacultyClasses
      ),

      switchMap(({

        key,

        facultyId,

        program

      }) => {

        return this.api
          .loadFacultyClasses(
            facultyId,
            program
          )
          .pipe(

            map(classes =>

              ActionsSet
                .loadFacultyClassesSuccess({

                  key,

                  facultyId,

                  classes

                })

            ),

            catchError(error => {

              this.toast.showToast(
                'Failed to load faculty classes',
                'error'
              );

              return of(

                ActionsSet
                  .loadFacultyClassesFailure({

                    key,

                    facultyId,

                    error

                  })

              );

            })

          );

      })

    )

  );

  /* ================= SINGLE STATUS ================= */

  loadEvaluationStatus$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        SupervisorDataActions
          .loadEvaluationStatus
      ),

      filter(({ role }) => !!role),

      withLatestFrom(

        this.store.select(
          state =>
            state.supervisorData
              .evaluationStatus
        )

      ),

      filter(([{
        key,
        context
      }, state]) => {

        const cached =
          state[key]
            ?.classes
            ?.[context.evaluationKey];

        return !cached ||
          cached.evaluated === null;

      }),

      switchMap(([{
        key,
        context,
        role
      }]) =>

        this.evaluationDataService
          .checkEvaluationStatus(

            role!,

            context.facultyId,

            context.evaluatorId,

            context.classCode,

            context.subjectCode,

            context.yearLevel,

            context.semester,

            context.schoolYear

          )
          .pipe(

            map(res =>

              SupervisorDataActions
                .loadEvaluationStatusSuccess({

                  key,

                  evaluationKey:
                    context.evaluationKey,

                  evaluated:
                    res.hasEvaluated

                })

            ),

            catchError(error =>

              of(

                SupervisorDataActions
                  .loadEvaluationStatusFailure({

                    key,

                    evaluationKey:
                      context.evaluationKey,

                    error:
                      error.message ||
                      'Evaluation status failed'

                  })

              )

            )

          )

      )

    )

  );

  /* ================= NAVIGATION ================= */

  selectClass$ = createEffect(

    () =>

      this.actions$.pipe(

        ofType(
          ActionsSet
            .selectFacultyClassForEvaluation
        ),

        filter(a => !!a.selectedClass),

        withLatestFrom(
          this.store.select(s => s.auth)
        ),

        tap(([{
          selectedClass
        }, auth]) => {

          const evaluationKey =
            this.buildEvaluationKey(

              selectedClass!.classCode,

              selectedClass!.subjectCode,

              selectedClass!.yearLevel,

              selectedClass!.semester,

              selectedClass!.schoolYear

            );

          this.store.dispatch(

            ActionsSet
              .loadEvaluationStatus({

                key:
                  `${auth.college}-ACTIVE`,

                role:
                  auth.role,

                context: {

                  facultyId:
                    selectedClass!.facultyId,

                  evaluatorId:
                    auth.evaluatorId,

                  classCode:
                    selectedClass!.classCode,

                  subjectCode:
                    selectedClass!.subjectCode,

                  yearLevel:
                    selectedClass!.yearLevel,

                  semester:
                    selectedClass!.semester,

                  schoolYear:
                    selectedClass!.schoolYear,

                  college:
                    selectedClass!.college,

                  evaluationKey

                }

              })

          );

          this.router.navigate([
            '/evaluation-form'
          ]);

        })

      ),

    {
      dispatch: false
    }

  );

}