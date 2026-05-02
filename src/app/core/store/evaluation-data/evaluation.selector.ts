import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EvaluationDataState } from './evaluation.state';

export const selectEvaluationDataState =
  createFeatureSelector<EvaluationDataState>('evaluationData');
export const selectEvaluationDataContext = createSelector(
  selectEvaluationDataState,
  (s) => s.evaluationDataContext,
);
export const selectHasEvaluated = createSelector(selectEvaluationDataState, (s) => s.hasEvaluated);
export const selectEvaluationLoading = createSelector(selectEvaluationDataState, (s) => s.loading);
export const selectSubmitting = createSelector(selectEvaluationDataState, (s) => s.submitting);
