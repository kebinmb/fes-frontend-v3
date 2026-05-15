import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';

import * as ActionsSet from './supervisor-data.actions';
import * as SupervisorDataActions from './supervisor-data.actions';

import { SupervisorDataService } from '../../services/supervisor-data/supervisor-data-service';
import { EvaluationService } from '../../services/evaluation/evaluation-service';

import { Store } from '@ngrx/store';
import { Router } from '@angular/router';

import { SpinnerFacade } from '../spinner/spinner.facade';
import { ToastFacade } from '../toast/toast.facade';

import {
  catchError,
  filter,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom
} from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SupervisorDataEffects {

  private actions$ = inject(Actions);

  private api = inject(SupervisorDataService);

  private evaluationDataService =
    inject(EvaluationService);

  private store = inject(Store);

  private router = inject(Router);

  private spinner = inject(SpinnerFacade);

  private toast = inject(ToastFacade);

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

    ofType(ActionsSet.loadFaculties),

    switchMap(({ key, program }) => {

      this.spinner.showSpinner();

      return this.api
        .getFacultyLoadsByProgram(program)
        .pipe(

          switchMap(res => [

            ActionsSet.loadFacultiesSuccess({
              key,
              response: res
            }),

            ActionsSet.loadAllFacultyClasses({
              key,
              faculties: res,
              program
            })

          ]),

          catchError(err => {

            this.toast.showToast(
              'Failed to load faculties',
              'error'
            );

            return of(
              ActionsSet.loadFacultiesFailure({
                key,
                error: err
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

  /* ================= CLASSES ================= */

  loadAllFacultyClasses$ = createEffect(() =>

    this.actions$.pipe(

      ofType(ActionsSet.loadAllFacultyClasses),

      switchMap(({ key, faculties, program }) => {

        this.spinner.showSpinner();

        return forkJoin(

          faculties.map(f =>

            this.api
              .loadFacultyClasses(f.facultyId, program)
              .pipe(

                map(classes => ({
                  facultyId: f.facultyId,
                  classes
                })),

                catchError(() =>
                  of({
                    facultyId: f.facultyId,
                    classes: []
                  })
                )

              )

          )

        ).pipe(

          map(results =>
            ActionsSet.loadAllFacultyClassesSuccess({
              key,
              results
            })
          ),

          catchError(err =>
            of(
              ActionsSet.loadAllFacultyClassesFailure({
                key,
                error: err
              })
            )
          ),

          finalize(() =>
            this.spinner.hideSpinner()
          )

        );

      })

    )

  );

  /* ================= SINGLE STATUS ================= */

  loadEvaluationStatus$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        SupervisorDataActions.loadEvaluationStatus
      ),

      filter(({ role }) => !!role),

      withLatestFrom(
        this.store.select(
          state => state.supervisorData.evaluationStatus
        )
      ),

      filter(([{ key, context }, state]) => {

        const cached =
          state[key]
            ?.classes
            ?.[context.evaluationKey];

        return !cached ||
          cached.evaluated === null;

      }),

      switchMap(([{ key, context, role }]) =>

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

            catchError(err =>

              of(

                SupervisorDataActions
                  .loadEvaluationStatusFailure({

                    key,

                    evaluationKey:
                      context.evaluationKey,

                    error:
                      err.message ||
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
          ActionsSet.selectFacultyClassForEvaluation
        ),

        filter(a => !!a.selectedClass),

        withLatestFrom(
          this.store.select(s => s.auth)
        ),

        tap(([{ selectedClass }, auth]) => {

          const evaluationKey =
            this.buildEvaluationKey(
              selectedClass!.classCode,
              selectedClass!.subjectCode,
              selectedClass!.yearLevel,
              selectedClass!.semester,
              selectedClass!.schoolYear
            );

          this.store.dispatch(

            ActionsSet.loadEvaluationStatus({

              key: `${auth.college}-ACTIVE`,

              role: auth.role,

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

    { dispatch: false }
  );

  /* ================= BATCH TRIGGER ================= */

  loadEvaluationStatusBatchTrigger$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        ActionsSet.loadAllFacultyClassesSuccess
      ),

      withLatestFrom(
        this.store.select(s => s.auth)
      ),

      filter(([_, auth]) =>
        !!auth.role &&
        !!auth.evaluatorId
      ),

      map(([{ key, results }, auth]) => {

        const payload = results.flatMap(r =>

          r.classes.map(cls => ({

            facultyId: r.facultyId,

            classCode: cls.classCode,

            subjectCode: cls.subjectCode,

            yearLevel: cls.yearLevel,

            semester: cls.semester,

            schoolYear: cls.schoolYear,

            evaluationKey:
              this.buildEvaluationKey(
                cls.classCode,
                cls.subjectCode,
                cls.yearLevel,
                cls.semester,
                cls.schoolYear
              )

          }))

        );

        return ActionsSet
          .loadEvaluationStatusBatch({

            key,

            role: auth.role!,

            evaluatorId:
              auth.evaluatorId!,

            payload

          });

      })

    )

  );

  /* ================= BATCH STATUS ================= */

  loadEvaluationStatusBatch$ = createEffect(() =>

    this.actions$.pipe(

      ofType(
        ActionsSet.loadEvaluationStatusBatch
      ),

      switchMap(({
        key,
        role,
        evaluatorId,
        payload
      }) =>

        forkJoin(

          payload.map(item =>

            this.evaluationDataService
              .checkEvaluationStatus(
                role,
                item.facultyId,
                evaluatorId,
                item.classCode,
                item.subjectCode,
                item.yearLevel,
                item.semester,
                item.schoolYear
              )
              .pipe(

                map(res => ({

                  classCode:
                    item.classCode,

                  subjectCode:
                    item.subjectCode,

                  yearLevel:
                    item.yearLevel,

                  semester:
                    item.semester,

                  schoolYear:
                    item.schoolYear,

                  evaluationKey:
                    item.evaluationKey,

                  evaluated:
                    res.hasEvaluated

                })),

                catchError(() =>

                  of({

                    classCode:
                      item.classCode,

                    subjectCode:
                      item.subjectCode,

                    yearLevel:
                      item.yearLevel,

                    semester:
                      item.semester,

                    schoolYear:
                      item.schoolYear,

                    evaluationKey:
                      item.evaluationKey,

                    evaluated: false

                  })

                )

              )

          )

        ).pipe(

          map(results =>

            ActionsSet
              .loadEvaluationStatusBatchSuccess({
                key,
                results
              })

          ),

          catchError(err =>

            of(

              ActionsSet
                .loadEvaluationStatusBatchFailure({
                  key,
                  error: err
                })

            )

          )

        )

      )

    )

  );

}