import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { StudentDataService } from '../../services/student-data/student-data-service';
import { Store } from '@ngrx/store';
import {
  EvaluationCheckResponse,
  EvaluationService,
} from '../../services/evaluation/evaluation-service';
import * as StudentDataActions from './student-data.action';
import {
  catchError,
  exhaustMap,
  filter,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
} from 'rxjs';
import { selectEvaluationMap, selectStudentDataCache } from './student-data.selectors';
import { createStudentLoadsKey } from './student-data.reducer';
import { extractErrorMessage } from '../../../utilities/extract-error.util';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { ToastFacade } from '../toast/toast.facade';
import { selectRole } from '../auth/auth.selector';
import { Router } from '@angular/router';
@Injectable({
  providedIn: 'root',
})
export class StudentDataEffects {
  private actions$ = inject(Actions);
  private studentDataService = inject(StudentDataService);
  private store = inject(Store);
  private evaluationService = inject(EvaluationService);
  private spinnerFacade = inject(SpinnerFacade);
  private toastFacade = inject(ToastFacade);
  private router = inject(Router);
  loadStudentLoads$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentDataActions.loadStudentLoads),
      withLatestFrom(
        this.store.select(selectStudentDataCache),
        this.store.select(selectEvaluationMap),
        this.store.select(selectRole)
      ),

      filter(([action, cache, evaluationMap, role]) => {
        if (role !== 'ROLE_STUDENT') return false;

        const key = createStudentLoadsKey(
          action.studentId,
          action.page,
          action.size,
          action.sort
        );

        const hasCache = !!cache[key];
        const hasEvaluation = Object.keys(evaluationMap).length > 0;

        // 🔥 KEY FIX
        return !hasCache || !hasEvaluation;
      }),

      tap(() => this.spinnerFacade.showSpinner()),

      exhaustMap(([action, cache]) => {
        const key = createStudentLoadsKey(
          action.studentId,
          action.page,
          action.size,
          action.sort
        );

        const cached = cache[key];

        // ✅ If cached → reuse but still trigger evaluation if missing
        if (cached) {
          this.spinnerFacade.hideSpinner();

          return of(
            StudentDataActions.loadEvaluationStatus({
              classes: cached.content,
              studentId: action.studentId,
            })
          );
        }

        // ✅ Otherwise fetch normally
        return this.studentDataService
          .getStudentLoads(action.studentId, action.page, action.size, action.sort)
          .pipe(
            switchMap((response) => {
              this.spinnerFacade.hideSpinner();

              const classes = response.content;

              return [
                StudentDataActions.loadStudentLoadsSuccess({
                  key,
                  response,
                }),

                StudentDataActions.loadEvaluationStatus({
                  classes,
                  studentId: action.studentId,
                }),
              ];
            }),
            catchError((error) => {
              this.spinnerFacade.hideSpinner();

              return of(
                StudentDataActions.loadStudentLoadsFailure({
                  error: extractErrorMessage(error),
                })
              );
            })
          );
      })
    )
  );

  loadEvaluationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentDataActions.loadEvaluationStatus),
      withLatestFrom(this.store.select(selectRole)),
      filter(([_, role]) => role === 'ROLE_STUDENT'),
      tap(() => this.spinnerFacade.showSpinner()),
      exhaustMap(([{ classes, studentId }, role]) => {
        if (!classes?.length) {
          this.spinnerFacade.hideSpinner();
          return of(); // 🔥 do NOTHING instead of overwriting
        }
        const buildKey = (cls: any) =>
          `${cls.facultyId}-${cls.classCode}-${cls.semester}-${cls.schoolYear}`;
        const requests = classes.map((cls) =>
          this.evaluationService
            .checkEvaluationStatus(
              role!,
              cls.facultyId,
              studentId,
              cls.classCode,
              cls.subjectCode,
              cls.yearLevel,
              cls.semester,
              cls.schoolYear,
            )
            .pipe(
              map((res: EvaluationCheckResponse) => ({
                key: buildKey(cls),
                evaluated: res.hasEvaluated,
              })),
              catchError((err) => {
                console.error('Evaluation API ERROR:', err);
                return of({
                  key: buildKey(cls),
                  evaluated: null,
                });
              }),
            ),
        );
        return forkJoin(requests).pipe(
          map((results) => {
            const evaluationMap: Record<string, boolean | null> = {};
            results.forEach((r) => {
              evaluationMap[r.key] = r.evaluated;
            });
            this.spinnerFacade.hideSpinner();
            return StudentDataActions.loadEvaluationStatusSuccess({
              evaluationMap,
            });
          }),
          catchError((err) => {
            this.spinnerFacade.hideSpinner();
            return of(
              StudentDataActions.loadEvaluationStatusFailure({
                error: extractErrorMessage(err),
              }),
            );
          }),
        );
      }),
    ),
  );

  selectStudentClassForEvaluation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(StudentDataActions.selectStudentClassForEvaluation),
        tap(({ selectedClass }) => {
          console.log('Selected class key:', selectedClass);
          this.router.navigate(['/evaluation-form']);
        }),
      ),
    { dispatch: false },
  );
}
