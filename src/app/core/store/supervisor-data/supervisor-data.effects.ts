import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { SupervisorDataService } from '../../services/supervisor-data/supervisor-data-service';
import { ToastFacade } from '../toast/toast.facade';
import { SpinnerFacade } from '../spinner/spinner.facade';
import { Store } from '@ngrx/store';
import * as SupervisorDataActions from './supervisor-data.actions';
import {
  catchError,
  filter,
  map,
  of,
  switchMap,
  tap,
  withLatestFrom,
  finalize,
  mergeMap,
} from 'rxjs';
import { EvaluationService } from '../../services/evaluation/evaluation-service';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class SupervisorDataEffects {
  private actions$ = inject(Actions);
  private supervisorDataService = inject(SupervisorDataService);
  private toastFacade = inject(ToastFacade);
  private spinnerFacade = inject(SpinnerFacade);
  private store = inject(Store);
  private evaluationDataService = inject(EvaluationService);
  private router = inject(Router);
  loadFaculties$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupervisorDataActions.loadFaculties),
      withLatestFrom(this.store.select((state) => state.supervisorData.faculties)),
      filter(([{ key }, faculties]) => {
        const cached = faculties[key];
        return !cached || cached.data.length === 0;
      }),
      switchMap(([{ key, college, status }]) => {
        this.spinnerFacade.showSpinner();
        return this.supervisorDataService.getFaculties(college, status).pipe(
          tap((response) => console.log('Faculties:', response)),
          map((response) => SupervisorDataActions.loadFacultiesSuccess({ key, response })),
          tap(() => this.spinnerFacade.hideSpinner()),
          catchError((error) => {
            this.toastFacade.showToast('Failed to load faculties', 'error');
            return of(SupervisorDataActions.loadFacultiesFailure({ key, error }));
          }),

          finalize(() => this.spinnerFacade.hideSpinner()),
        );
      }),
    ),
  );
  loadFacultyClasses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupervisorDataActions.loadFacultyClasses),

      tap(() => console.log('faculty classes triggered')),

      withLatestFrom(this.store.select((state) => state.supervisorData.facultyClasses)),
      tap(([action, state]) => {
        console.log('ACTION:', action);
        console.log('CACHED STATE:', state[action.key]);
      }),
      filter(([{ key, facultyId }, state]) => {
        const cached = state[key]?.[facultyId];

        return !cached || !cached.classes || cached.classes.length === 0;
      }),

      mergeMap(([{ key, facultyId }]) => {
        this.spinnerFacade.showSpinner();

        return this.supervisorDataService.loadFacultyClasses(facultyId).pipe(
          map((classes) =>
            SupervisorDataActions.loadFacultyClassesSuccess({
              key,
              data: { facultyId, classes },
            }),
          ),
          catchError((error) =>
            of(
              SupervisorDataActions.loadFacultyClassesFailure({
                key,
                facultyId,
                error: error.message || 'Failed to load classes',
              }),
            ),
          ),
          finalize(() => this.spinnerFacade.hideSpinner()),
        );
      }),
    ),
  );
  loadFacultyClassesAfterFaculties$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupervisorDataActions.loadFacultiesSuccess),
      mergeMap(({ key, response }) =>
        response.map((faculty) =>
          SupervisorDataActions.loadFacultyClasses({
            key,
            facultyId: faculty.facultyId,
          }),
        ),
      ),
    ),
  );
  loadEvaluationStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupervisorDataActions.loadEvaluationStatus),

      withLatestFrom(this.store.select((state) => state.supervisorData.evaluationStatus)),

      filter(([{ key, context }, state]) => {
        const cached = state[key]?.classes?.[context.classCode];
        return !cached || cached.evaluated === null;
      }),

      switchMap(([{ key, context, role }]) =>
        this.evaluationDataService
          .checkEvaluationStatus(
            role!,
            context.facultyId,
            context.evaluatorId,
            context.classCode,
            context.semester,
            context.schoolYear,
          )
          .pipe(
            map((res) =>
              SupervisorDataActions.loadEvaluationStatusSuccess({
                key,
                classCode: context.classCode,
                evaluated: res.hasEvaluated,
              }),
            ),
            catchError((err) =>
              of(
                SupervisorDataActions.loadEvaluationStatusFailure({
                  key,
                  classCode: context.classCode,
                  error: err.message,
                }),
              ),
            ),
          ),
      ),
    ),
  );

  selectClassForEvaluation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SupervisorDataActions.selectFacultyClassForEvaluation),

        // ✅ filter null early
        filter(({ selectedClass }) => !!selectedClass),

        withLatestFrom(this.store.select((state) => state.auth)),

        tap(([{ selectedClass }, auth]) => {
          console.log('Selected supervisor class:', selectedClass);

          this.store.dispatch(
            SupervisorDataActions.loadEvaluationStatus({
              key: `${auth.college}-ACTIVE`,
              role: auth.role,
              context: {
                facultyId: selectedClass!.facultyId,
                evaluatorId: auth.evaluatorId,
                classCode: selectedClass!.classCode,
                semester: selectedClass!.semester,
                schoolYear: selectedClass!.schoolYear,
                subjectCode:selectedClass!.subjectCode,
                college:selectedClass!.college,
                yearLevel:selectedClass!.yearLevel
              },
            }),
          );

          this.router.navigate(['/evaluation-form']);
        }),
      ),
    { dispatch: false },
  );
}
