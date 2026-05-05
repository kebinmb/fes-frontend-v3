import { createAction, props } from "@ngrx/store";
import { FetchFacultyEvaluationScoreResponse, FetchFacultyResponse, FetchUserAccountsResponse, PageResponse } from "../../services/admin/admin-service";

export const loadFaculties = createAction(
  '[Admin] Load Faculties',
  props<{ page: number; size: number }>()
);

export const loadFacultiesSuccess = createAction(
  '[Admin] Load Faculties Success',
  props<{ response: PageResponse<FetchFacultyResponse> }>()
);

export const loadFacultiesFailure = createAction(
  '[Admin] Load Faculties Failure',
  props<{ error: any }>()
);

export const loadUserAccounts = createAction(
  '[Admin] Load User Accounts',
  props<{ page: number; size: number }>()
);

export const loadUserAccountsSuccess = createAction(
  '[Admin] Load User Accounts Success',
  props<{ response: PageResponse<FetchUserAccountsResponse> }>()
);

export const loadUserAccountsFailure = createAction(
  '[Admin] Load User Accounts Failure',
  props<{ error: any }>()
);

export const loadFacultyEvaluationScores = createAction(
  '[Admin] Load Faculty Evaluation Scores',
  props<{ page: number; size: number }>()
);

export const loadFacultyEvaluationScoresSuccess = createAction(
  '[Admin] Load Faculty Evaluation Scores Success',
  props<{ response: PageResponse<FetchFacultyEvaluationScoreResponse> }>()
);

export const loadFacultyEvaluationScoresFailure = createAction(
  '[Admin] Load Faculty Evaluation Scores Failure',
  props<{ error: any }>()
);