import { createFeatureSelector, createSelector } from '@ngrx/store';

import { StudentEvaluationState } from './student-evaluation-data.state';

export const selectStudentEvaluationState =
  createFeatureSelector<StudentEvaluationState>(
    'studentEvaluationReducer',
  );

export const selectStudentEvaluations = createSelector(
  selectStudentEvaluationState,
  (state) => state?.studentEvaluations,
);

export const selectStudentEvaluationLoading = createSelector(
  selectStudentEvaluationState,
  (state) => state?.loading ?? false,
);

export const selectStudentEvaluationError = createSelector(
  selectStudentEvaluationState,
  (state) => state?.error ?? null,
);

export const selectStudentEvaluationContent = createSelector(
  selectStudentEvaluations,
  (response) => response?.content ?? [],
);

export const selectStudentEvaluationTotalElements = createSelector(
  selectStudentEvaluations,
  (response) => response?.totalElements ?? 0,
);

export const selectStudentEvaluationTotalPages = createSelector(
  selectStudentEvaluations,
  (response) => response?.totalPages ?? 0,
);