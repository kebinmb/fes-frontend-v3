import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { select, Store } from '@ngrx/store';
import {
  withLatestFrom,
  filter,
  exhaustMap,
  of,
  switchMap,
  catchError,
  tap,
  map,
  forkJoin,
} from 'rxjs';
import { extractErrorMessage } from '../../../utilities/extract-error.util';
import { EvaluationService } from '../../services/evaluation/evaluation-service';
import {
  StudentClassLoadDTO,
  StudentDataService,
} from '../../services/student-data/student-data-service';
import { selectRole } from '../auth/auth.selector';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { ToastFacade } from '../toast/toast.facade';
import { buildEvalKey, createStudentLoadsKey } from './student-data.reducer';
import { selectCache, selectEvaluationMap } from './student-data.selectors';
import * as StudentDataActions from './student-data.action';
@Injectable({ providedIn: 'root' })
export class StudentDataEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private studentDataService = inject(StudentDataService);
  private evaluationService = inject(EvaluationService);
  private spinner = inject(SpinnerFacade);
  private toastFacade = inject(ToastFacade);
  private router = inject(Router);
  private spinnerFacade = inject(SpinnerFacade);
  loadStudentLoads$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentDataActions.loadStudentLoads),
      withLatestFrom(this.store.select(selectCache), this.store.select(selectRole)),
      filter(([_, __, role]) => role === 'ROLE_STUDENT'),

      exhaustMap(([action, cache]) => {
        const key = createStudentLoadsKey(action.studentId, action.page, action.size, action.sort);

        // ✅ CACHE HIT
        if (cache[key]) {
          return of(
            StudentDataActions.loadEvaluationStatus({
              classes: cache[key].content,
              studentId: action.studentId,
            }),
          );
        }

        this.spinnerFacade.showSpinner();

        return this.studentDataService
          .getStudentLoads(action.studentId, action.page, action.size, action.sort)
          .pipe(
            switchMap((response) => [
              StudentDataActions.loadStudentLoadsSuccess({
                key,
                response,
              }),
              StudentDataActions.loadEvaluationStatus({
                classes: response.content,
                studentId: action.studentId,
              }),
            ]),
            catchError((error) =>
              of(
                StudentDataActions.loadStudentLoadsFailure({
                  error: extractErrorMessage(error),
                }),
              ),
            ),
            tap(() => this.spinnerFacade.hideSpinner()),
          );
      }),
    ),
  );
  loadEvaluationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(StudentDataActions.loadEvaluationStatus),
      withLatestFrom(this.store.select(selectEvaluationMap), this.store.select(selectRole)),
      filter(([_, __, role]) => role === 'ROLE_STUDENT'),

      exhaustMap(([{ classes, studentId }, existingMap]) => {
        if (!classes?.length) return of();

        this.spinnerFacade.showSpinner();

        const buildKey = (cls: StudentClassLoadDTO) =>
          `${cls.facultyId}-${cls.classCode}-${cls.semester}-${cls.schoolYear}`;

        const requests = classes.map((cls) => {
          const key = buildKey(cls);

          if (existingMap[key] === true) {
            return of({ key, evaluated: true });
          }

          return this.evaluationService
            .checkEvaluationStatus(
              'ROLE_STUDENT',
              cls.facultyId,
              studentId,
              cls.classCode,
              cls.subjectCode,
              cls.yearLevel,
              cls.semester,
              cls.schoolYear,
            )
            .pipe(
              map((res) => ({
                key,
                evaluated: res.hasEvaluated,
              })),
              catchError(() =>
                of({
                  key,
                  evaluated: null,
                }),
              ),
            );
        });

        return forkJoin(requests).pipe(
          map((results) => {
            const evaluationMap = { ...existingMap };

            results.forEach((r) => {
              evaluationMap[r.key] = r.evaluated;
            });

            return StudentDataActions.loadEvaluationStatusSuccess({
              evaluationMap,
            });
          }),
          catchError((err) =>
            of(
              StudentDataActions.loadEvaluationStatusFailure({
                error: extractErrorMessage(err),
              }),
            ),
          ),
          tap(() => this.spinnerFacade.hideSpinner()),
        );
      }),
    ),
  );

  navigateToEvaluation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(StudentDataActions.selectStudentClassForEvaluation),
        tap(() => this.router.navigate(['/evaluation-form'])),
      ),
    { dispatch: false },
  );
}
