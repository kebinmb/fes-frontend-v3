import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminState } from './admin-data.state';

export const selectAdminDataState = createFeatureSelector<AdminState>('adminData');
export const selectFaculties = createSelector(selectAdminDataState, (state) => state.faculties);

export const selectUserAccounts = createSelector(
  selectAdminDataState,
  (state) => state.userAccounts,
);

export const selectFacultyEvaluationScores = createSelector(
  selectAdminDataState,
  (state) => state.facultyEvaluationScores,
);

export const selectLoading = createSelector(selectAdminDataState, (state) => state.loading);

export const selectError = createSelector(selectAdminDataState, (state) => state.error);
