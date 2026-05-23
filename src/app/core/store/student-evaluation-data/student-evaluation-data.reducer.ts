import { createReducer, on } from "@ngrx/store";
import { loadStudentEvaluations, loadStudentEvaluationsSuccess, loadStudentEvaluationsFailure, clearStudentEvaluations } from "./student-evaluation-data.action";
import { initialStudentEvaluationState, StudentEvaluationState } from "./student-evaluation-data.state";

export const studentEvaluationFeatureKey = 'studentEvaluationReducer';

export const studentEvaluationReducer = createReducer(
  initialStudentEvaluationState,

  on(loadStudentEvaluations, (state): StudentEvaluationState => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(
    loadStudentEvaluationsSuccess,
    (state, { response }): StudentEvaluationState => ({
      ...state,
      studentEvaluations: response,
      loading: false,
      error: null,
    }),
  ),

  on(
    loadStudentEvaluationsFailure,
    (state, { error }): StudentEvaluationState => ({
      ...state,
      loading: false,
      error,
    }),
  ),

  on(clearStudentEvaluations, (): StudentEvaluationState => ({
    ...initialStudentEvaluationState,
  })),
);