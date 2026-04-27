import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';

export const selectAuthenticationState = createFeatureSelector<AuthState>('auth');

export const selectEvaluatorId = createSelector(
  selectAuthenticationState,
  (state) => state.evaluatorId,
);

export const selectRole = createSelector(selectAuthenticationState, (state) => state.role);
export const selectCollege = createSelector(selectAuthenticationState,(state) => state.college);
export const selectAccessCode = createSelector(
  selectAuthenticationState,
  (state) => state.accessCode,
);

export const selectAuthenticationError = createSelector(selectAuthenticationState, (state) => state.error);
