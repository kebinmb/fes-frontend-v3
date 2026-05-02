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
import { selectStudentDataCache } from './student-data.selectors';
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

      // ✅ ADD ROLE CHECK
      withLatestFrom(this.store.select(selectStudentDataCache), this.store.select(selectRole)),

      filter(([action, cache, role]) => {
        if (role !== 'ROLE_STUDENT') return false; // 🔥 KEY FIX

        const key = createStudentLoadsKey(action.studentId, action.page, action.size, action.sort);

        return !cache[key];
      }),

      tap(() => this.spinnerFacade.showSpinner()),

      exhaustMap(([action]) => {
        const key = createStudentLoadsKey(action.studentId, action.page, action.size, action.sort);

        return this.studentDataService
          .getStudentLoads(action.studentId, action.page, action.size, action.sort)
          .pipe(
            switchMap((response) => {
              this.spinnerFacade.hideSpinner();
              this.toastFacade.showToast('Classes Loaded.', 'success');

              const classes = response.content;

              return [
                StudentDataActions.loadStudentLoadsSuccess({
                  key,
                  response,
                }),

                // ✅ This will now ONLY fire for students
                StudentDataActions.loadEvaluationStatus({
                  classes,
                  studentId: action.studentId,
                }),
              ];
            }),

            catchError((error) => {
              this.spinnerFacade.hideSpinner();
              this.toastFacade.showToast(
                'Error in fetching class, please contact administrator.',
                'error',
              );

              return of(
                StudentDataActions.loadStudentLoadsFailure({
                  error: extractErrorMessage(error),
                }),
              );
            }),
          );
      }),
    ),
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
          return of(
            StudentDataActions.loadEvaluationStatusSuccess({
              evaluationMap: {},
            }),
          );
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
