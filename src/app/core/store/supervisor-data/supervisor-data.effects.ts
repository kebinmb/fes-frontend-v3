import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import * as ActionsSet from './supervisor-data.actions';
import { SupervisorDataService } from '../../services/supervisor-data/supervisor-data-service';
import { EvaluationService } from '../../services/evaluation/evaluation-service';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { ToastFacade } from '../toast/toast.facade';
import {
  catchError,
  filter,
  forkJoin,
  map,
  of,
  switchMap,
  withLatestFrom,
  finalize,
  tap
} from 'rxjs';
import * as SupervisorDataActions from './supervisor-data.actions';
@Injectable({ providedIn: 'root' })
export class SupervisorDataEffects {
  private actions$ = inject(Actions);
  private api = inject(SupervisorDataService);
  private evaluationDataService = inject(EvaluationService);
  private store = inject(Store);
  private router = inject(Router);
  private spinner = inject(SpinnerFacade);
  private toast = inject(ToastFacade);

  // FACULTIES
  loadFaculties$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.loadFaculties),
      withLatestFrom(this.store.select(s => s.supervisorData.faculties)),
      filter(([{ key }, state]) => !state[key] || state[key].data.length === 0),
      switchMap(([{ key, college, status }]) => {
        this.spinner.showSpinner();

        return this.api.getFaculties(college, status).pipe(
          switchMap(res => [
            ActionsSet.loadFacultiesSuccess({ key, response: res }),
            ActionsSet.loadAllFacultyClasses({ key, faculties: res })
          ]),
          catchError(err => {
            this.toast.showToast('Failed to load faculties', 'error');
            return of(ActionsSet.loadFacultiesFailure({ key, error: err }));
          }),
          finalize(() => this.spinner.hideSpinner())
        );
      })
    )
  );

  // CLASSES (BATCH)
  loadAllFacultyClasses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.loadAllFacultyClasses),
      switchMap(({ key, faculties }) => {
        this.spinner.showSpinner();

        return forkJoin(
          faculties.map(f =>
            this.api.loadFacultyClasses(f.facultyId).pipe(
              map(classes => ({ facultyId: f.facultyId, classes })),
              catchError(() => of({ facultyId: f.facultyId, classes: [] }))
            )
          )
        ).pipe(
          map(results => ActionsSet.loadAllFacultyClassesSuccess({ key, results })),
          catchError(err =>
            of(ActionsSet.loadAllFacultyClassesFailure({ key, error: err }))
          ),
          finalize(() => this.spinner.hideSpinner())
        );
      })
    )
  );

  // EVALUATION
  loadEvaluationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupervisorDataActions.loadEvaluationStatus),

      // ✅ prevent null role
      filter(({ role }) => !!role),

      withLatestFrom(
        this.store.select((state) => state.supervisorData.evaluationStatus)
      ),

      filter(([{ key, context }, state]) => {
        const cached = state[key]?.classes?.[context.classCode];
        return !cached || cached.evaluated === null;
      }),

      switchMap(([{ key, context, role }]) =>
        this.evaluationDataService
          .checkEvaluationStatus(
            role!, // now SAFE
            context.facultyId,
            context.evaluatorId,
            context.classCode,
            context.yearLevel,
            context.subjectCode,
            context.semester,
            context.schoolYear
          )
          .pipe(
            map((res) =>
              SupervisorDataActions.loadEvaluationStatusSuccess({
                key,
                classCode: context.classCode,
                evaluated: res.hasEvaluated,
              })
            ),
            catchError((err) =>
              of(
                SupervisorDataActions.loadEvaluationStatusFailure({
                  key,
                  classCode: context.classCode,
                  error: err.message || 'Evaluation status failed',
                })
              )
            )
          )
      )
    )
  );

  // NAVIGATION
  selectClass$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(ActionsSet.selectFacultyClassForEvaluation),
        filter(a => !!a.selectedClass),
        withLatestFrom(this.store.select(s => s.auth)),
        tap(([{ selectedClass }, auth]) => {
          this.store.dispatch(ActionsSet.loadEvaluationStatus({
            key: `${auth.college}-ACTIVE`,
            role: auth.role,
            context: {
              facultyId: selectedClass!.facultyId,
              evaluatorId: auth.evaluatorId,
              classCode: selectedClass!.classCode,
              semester: selectedClass!.semester,
              schoolYear: selectedClass!.schoolYear,
              subjectCode: selectedClass!.subjectCode,
              college: selectedClass!.college,
              yearLevel: selectedClass!.yearLevel
            }
          }));

          this.router.navigate(['/evaluation-form']);
        })
      ),
    { dispatch: false }
  );

  loadEvaluationStatusBatchTrigger$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.loadAllFacultyClassesSuccess),
      withLatestFrom(this.store.select(s => s.auth)),
      filter(([_, auth]) => !!auth.role && !!auth.evaluatorId),

      map(([{ key, results }, auth]) => {
        const payload = results.flatMap(r =>
          r.classes.map(cls => ({
            facultyId: r.facultyId,
            classCode: cls.classCode,
            subjectCode: cls.subjectCode,
            yearLevel:cls.yearLevel,
            semester: cls.semester,
            schoolYear: cls.schoolYear
          }))
        );

        return ActionsSet.loadEvaluationStatusBatch({
          key,
          role: auth.role!,
          evaluatorId: auth.evaluatorId!,
          payload
        });
      })
    )
  );

  loadEvaluationStatusBatch$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ActionsSet.loadEvaluationStatusBatch),

      switchMap(({ key, role, evaluatorId, payload }) =>
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
                  classCode: item.classCode,
                  evaluated: res.hasEvaluated
                })),
                catchError(() =>
                  of({
                    classCode: item.classCode,
                    evaluated: false
                  })
                )
              )
          )
        ).pipe(
          map(results =>
            ActionsSet.loadEvaluationStatusBatchSuccess({ key, results })
          ),
          catchError(err =>
            of(ActionsSet.loadEvaluationStatusBatchFailure({ key, error: err }))
          )
        )
      )
    )
  );
}