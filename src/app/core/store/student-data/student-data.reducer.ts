import { createReducer, on } from '@ngrx/store';
import * as Actions from './student-data.action';
import { initialStudentDataState } from './student-data.state';

export const createStudentLoadsKey = (
  studentId: string,
  page: number,
  size: number,
  sort: string,
): string => `${studentId}-${page}-${size}-${sort}`;

export const buildEvalKey = (payload: {
  facultyId: string;
  classCode: string;
  semester: string;
  schoolYear: number;
}) =>
  `${payload.facultyId}-${payload.classCode}-${payload.semester}-${payload.schoolYear}`;

export const studentLoadReducer = createReducer(
  initialStudentDataState,

  // =========================
  // LOAD STUDENT LOADS
  // =========================
  on(Actions.loadStudentLoads, (state, { studentId, page, size, sort }) => {
    const key = createStudentLoadsKey(studentId, page, size, sort);

    if (state.cache[key]) {
      return {
        ...state,
        loadsReady: true,
      };
    }

    return {
      ...state,
      loading: true,
      error: null,
      loadsReady: false,
      evaluationReady: false, // 🔥 reset properly
    };
  }),

  // =========================
  // LOAD SUCCESS
  // =========================
  on(Actions.loadStudentLoadsSuccess, (state, { key, response }) => ({
    ...state,
    loading: false,
    cache: {
      ...state.cache,
      [key]: response,
    },
    loadsReady: true,
  })),

  // =========================
  on(Actions.loadStudentLoadsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    loadsReady: false,
  })),

  // =========================
  // EVALUATION SUCCESS
  // =========================
  on(Actions.loadEvaluationStatusSuccess, (state, { evaluationMap }) => {
    if (!evaluationMap || Object.keys(evaluationMap).length === 0) {
      return state;
    }

    return {
      ...state,
      evaluationMap: {
        ...state.evaluationMap,
        ...evaluationMap,
      },
      evaluationReady: true, // 🔥 CRITICAL FIX
    };
  }),

  // =========================
  on(Actions.loadEvaluationStatusFailure, (state, { error }) => ({
    ...state,
    error,
    evaluationReady: false,
  })),

  // =========================
  on(Actions.selectStudentClassForEvaluation, (state, { selectedClass }) => ({
    ...state,
    selectedClass,
  })),

  // =========================
  on(Actions.updateStudentEvaluatedClass, (state, payload) => {
    const key = buildEvalKey(payload);

    return {
      ...state,
      evaluationMap: {
        ...state.evaluationMap,
        [key]: true,
      },
    };
  }),

  on(Actions.resetEvaluationMap, (state) => ({
    ...state,
    evaluationMap: {},
    evaluationReady: false,
  }))
);