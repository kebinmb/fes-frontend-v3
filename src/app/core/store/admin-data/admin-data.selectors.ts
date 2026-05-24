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
export const selectUpdateFacultyMessage = createSelector(
  selectAdminDataState,
  (state) => state.updateFacultyMessage,
);
export const selectFacultyEvaluationScoresByFacultyId = createSelector(
  selectAdminDataState,

  (state) => state.facultyEvaluationScoresByFacultyId,
);
export const selectCreateUserAccountMessage = createSelector(
  selectAdminDataState,
  (state) => state.createUserAccountMessage,
);

export const selectUpdateUserAccountMessage = createSelector(
  selectAdminDataState,
  (state) => state.updateUserAccountMessage,
);

export const selectUpdateUserPasswordMessage = createSelector(
  selectAdminDataState,
  (state) => state.updateUserPasswordMessage,
);
