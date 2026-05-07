import { createReducer, on } from '@ngrx/store';
import { initialAdminState } from './admin-data.state';
import * as AdminActions from './admin-data.actions';
export const adminDataReducer = createReducer(
  initialAdminState,
  on(
    AdminActions.loadFaculties,
    AdminActions.loadUserAccounts,
    AdminActions.loadFacultyEvaluationScores,
    (state) => ({
      ...state,
      loading: true,
      error: null,
    }),
  ),
  on(AdminActions.loadFacultiesSuccess, (state, { response }) => ({
    ...state,
    faculties: response,
    loading: false,
  })),
  on(AdminActions.loadUserAccountsSuccess, (state, { response }) => ({
    ...state,
    userAccounts: response,
    loading: false,
  })),
  on(AdminActions.loadFacultyEvaluationScoresSuccess, (state, { response }) => ({
    ...state,
    facultyEvaluationScores: response,
    loading: false,
  })),
  on(
    AdminActions.loadFacultiesFailure,
    AdminActions.loadUserAccountsFailure,
    AdminActions.loadFacultyEvaluationScoresFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error,
    }),
  ),
  on(
    AdminActions.loadFaculties,
    AdminActions.loadUserAccounts,
    AdminActions.loadFacultyEvaluationScores,
    AdminActions.updateFaculty,
    AdminActions.loadFacultyEvaluationScoresByFacultyId,
    (state) => ({
      ...state,
      loading: true,
      error: null,
    }),
  ),
  on(AdminActions.updateFacultySuccess, (state, { response }) => ({
    ...state,
    updateFacultyMessage: response,
    loading: false,
  })),
  on(
    AdminActions.loadFacultiesFailure,
    AdminActions.loadUserAccountsFailure,
    AdminActions.loadFacultyEvaluationScoresFailure,
    AdminActions.updateFacultyFailure,
    AdminActions.loadFacultyEvaluationScoresByFacultyIdFailure,
    (state, { error }) => ({
      ...state,
      loading: false,
      error,
    }),
  ),
  on(AdminActions.loadFacultyEvaluationScoresByFacultyIdSuccess, (state, { response }) => ({
    ...state,
    facultyEvaluationScoresByFacultyId: response,
    loading: false,
  })),
);
