import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectRole } from '../auth/auth.selector';
import {
  DEFAULT_EVALUATION_TEMPLATE,
  SubjectEvaluationDTO,
} from '../../services/evaluation/evaluation-service';
import { map, of } from 'rxjs';
import { EvaluationContext } from '../supervisor-data/supervisor-data.actions';
import * as EvaluationDataSelectors from '../../store/evaluation-data/evaluation.selector';
import * as EvaluationDataActions from '../../store/evaluation-data/evaluation.action';
import { selectEvaluationLoading } from '../supervisor-data/supervisor-data.selectors';
@Injectable({
  providedIn: 'root',
})
export class EvaluationDataFacade {
  private store = inject(Store);
  template$ = of(DEFAULT_EVALUATION_TEMPLATE);
  isLoading$ = this.store.select(EvaluationDataSelectors.selectEvaluationLoading);
  hasEvaluated$ = this.store.select(EvaluationDataSelectors.selectHasEvaluated);
  submitting$ = this.store.select(EvaluationDataSelectors.selectSubmitting);
  //   evaluationContext$ = this.store.select(EvaluationDataSelectors.selectEvaluationDataContext);
  setContext(evaluationDataContext: EvaluationContext) {
    this.store.dispatch(EvaluationDataActions.setEvaluationContext({ evaluationDataContext }));
  }
  checkStatus() {
    this.store.dispatch(EvaluationDataActions.checkEvaluationStatus());
  }
  submit(payload: SubjectEvaluationDTO) {
    this.store.dispatch(EvaluationDataActions.submitEvaluation({ payload }));
  }
  initialize() {
    this.store.dispatch(EvaluationDataActions.initializeEvaluation());
  }
}
