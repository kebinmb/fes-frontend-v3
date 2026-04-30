import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EvaluationClass, EvaluationService } from '../../services/evaluation/evaluation-service';
import { Router } from '@angular/router';
import { ToastFacade } from '../toast/toast.facade';
import { SpinnerFacade } from '../spinner/spinner.facade';
import * as EvaluationActions from './evaluation.action';
import { filter, map, withLatestFrom } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { StudentDataFacade } from '../student-data/student-data.facade';
import { selectRole } from '../auth/auth.selector';
import * as StudentDataSelectors from './../../store/student-data/student-data.selectors';
import * as SupervisorDataSelectors from './../../store/supervisor-data/supervisor-data.selectors';
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
}
