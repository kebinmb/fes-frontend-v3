import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EvaluationClass, EvaluationService } from '../../services/evaluation/evaluation-service';
import { Router } from '@angular/router';
import { ToastFacade } from '../toast/toast.facade';
import { SpinnerFacade } from '../spinner/spinner.facade';
import * as EvaluationActions from './evaluation.action';
import { catchError, filter, map, of, switchMap, tap, withLatestFrom } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { StudentDataFacade } from '../student-data/student-data.facade';
import { selectRole } from '../auth/auth.selector';
import * as StudentDataSelectors from './../../store/student-data/student-data.selectors';
import * as SupervisorDataSelectors from './../../store/supervisor-data/supervisor-data.selectors';
import { selectEvaluationDataContext } from './evaluation.selector';
@Injectable()
export class EvaluationEffects {
  private actions$ = inject(Actions);
  private store = inject(Store);
  private evaluationService = inject(EvaluationService);
  private router = inject(Router);
  private toastFacade = inject(ToastFacade);
  private spinnerFacade = inject(SpinnerFacade);
  private authFacade = inject(AuthFacade);
  private studentDataFacade = inject(StudentDataFacade);
  init$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EvaluationActions.initializeEvaluation),

      withLatestFrom(
        this.store.select(selectRole),
        this.store.select(StudentDataSelectors.selectSelectedClass),
        this.store.select(SupervisorDataSelectors.selectSelectedClass),
      ),

      filter(([_, role, studentCls, supervisorCls]) => !!role && (!!studentCls || !!supervisorCls)),

      map(([_, role, studentCls, supervisorCls]) => {
        let cls: EvaluationClass | null = null;

        if (role === 'ROLE_STUDENT') {
          cls = studentCls;
        } else if (role === 'ROLE_DEAN') {
          cls = supervisorCls;
        }

        if (!cls) {
          return EvaluationActions.checkEvaluationStatusFailure({
            error: 'No class selected',
          });
        }

        return EvaluationActions.setEvaluationContext({
          evaluationDataContext: {
            facultyId: cls.facultyId,
            classCode: cls.classCode,
            subjectCode: cls.subjectCode,
            semester: cls.semester,
            schoolYear: cls.schoolYear,
            facultyName: cls.facultyName,
            subjectDescription: cls.subjectDescription ?? '',
            college: cls.college,
            yearLevel: 'yearLevel' in cls ? cls.yearLevel ?? 0 : 0,
          },
        });
      }),
    ),
  );

  submitEvaluation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(EvaluationActions.submitEvaluation),

      withLatestFrom(
        this.store.select(selectRole),
        this.store.select(selectEvaluationDataContext)
      ),

      filter(([{ payload }, role, context]) => !!payload && !!role && !!context),

      map(([{ payload }, role, context]) => {
        const finalPayload = {
          ...payload,
          facultyId: context!.facultyId,
          classCode: context!.classCode,
          subjectCode: context!.subjectCode,
          semester: context!.semester,
          schoolYear: context!.schoolYear,
        };

        return { role, finalPayload };
      }),

      switchMap(({ role, finalPayload }) => {
        this.spinnerFacade.showSpinner();

        return this.evaluationService.submitEvaluation(role!, finalPayload).pipe(
          map((response) =>
            EvaluationActions.submitEvaluationSuccess({ response })
          ),

          catchError((err) =>
            of(
              EvaluationActions.submitEvaluationFailure({
                error: err?.error?.message || 'Submission failed',
              })
            )
          )
        );
      })
    )
  );
  submitSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(EvaluationActions.submitEvaluationSuccess),
        tap(() => {
          this.spinnerFacade.hideSpinner();
          this.toastFacade.showToast('Evaluation submitted successfully', 'success');
          this.router.navigate(['/dashboard']); // optional
        })
      ),
    { dispatch: false }
  );

  submitFailure$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(EvaluationActions.submitEvaluationFailure),
        tap(({ error }) => {
          this.spinnerFacade.hideSpinner();
          this.toastFacade.showToast(error, 'error');
        })
      ),
    { dispatch: false }
  );
}
