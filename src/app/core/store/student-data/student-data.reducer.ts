import { createReducer, on } from '@ngrx/store';
import * as StudentDataActions from './student-data.action';
import { initialStudentDataState } from './student-data.state';

export const studentLoadReducer = createReducer(
  initialStudentDataState,

  // =========================
  // LOAD STUDENT LOADS
  // =========================
  on(StudentDataActions.loadStudentLoads, (state, action) => {
    const key = createStudentLoadsKey(action.studentId, action.page, action.size, action.sort);

    // ✅ Cache hit → DO NOT TOUCH evaluationMap
    if (state.cache[key]) {
      return {
        ...state,
        ready: true,
        loading: false,
      };
    }

    return {
      ...state,
      loading: true,
      error: null,
      ready: false,
    };
  }),

  // =========================
  // LOAD SUCCESS
  // =========================
  on(StudentDataActions.loadStudentLoadsSuccess, (state, { key, response }) => ({
    ...state,
    loading: false,
    ready: true,
    cache: {
      ...state.cache,
      [key]: response,
    },
    // ❌ DO NOT manually reassign evaluationMap
  })),

  // =========================
  // LOAD FAILURE
  // =========================
  on(StudentDataActions.loadStudentLoadsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    ready: false,
  })),

  // =========================
  // EVALUATION SUCCESS
  // =========================
  on(StudentDataActions.loadEvaluationStatusSuccess, (state, { evaluationMap }) => {
    // 🔥 Guard: prevent overwriting with empty map
    if (!evaluationMap || Object.keys(evaluationMap).length === 0) {
      return state;
    }

    return {
      ...state,
      evaluationMap: {
        ...state.evaluationMap,
        ...evaluationMap,
      },
    };
  }),

  // =========================
  // EVALUATION FAILURE
  // =========================
  on(StudentDataActions.loadEvaluationStatusFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  // =========================
  // SELECT CLASS
  // =========================
  on(StudentDataActions.selectStudentClassForEvaluation, (state, { selectedClass }) => ({
    ...state,
    selectedClass,
  })),

  // =========================
  // UPDATE SINGLE CLASS
  // =========================
  on(StudentDataActions.updateStudentEvaluatedClass, (state, payload) => {
    const key = `${payload.facultyId}-${payload.classCode}-${payload.semester}-${payload.schoolYear}`;

    return {
      ...state,
      evaluationMap: {
        ...state.evaluationMap,
        [key]: true,
      },
    };
  }),
);

export const createStudentLoadsKey = (
  studentId: string,
  page: number,
  size: number,
  sort: string,
): string => `${studentId}-${page}-${size}-${sort}`;
