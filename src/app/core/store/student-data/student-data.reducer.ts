import { createReducer, on } from '@ngrx/store';
import * as StudentDataActions from './student-data.action';
import { initialStudentDataState } from './student-data.state';

export const studentLoadReducer = createReducer(
  initialStudentDataState,

  on(StudentDataActions.loadStudentLoads, (state, action) => {
    const key = createStudentLoadsKey(action.studentId, action.page, action.size, action.sort);

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

  on(StudentDataActions.loadStudentLoadsSuccess, (state, { key, response }) => ({
    ...state,
    loading: false,
    ready: true,
    cache: {
      ...state.cache,
      [key]: response,
    },
  })),

  on(StudentDataActions.loadStudentLoadsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
    ready: false,
  })),

  on(StudentDataActions.loadEvaluationStatusSuccess, (state, { evaluationMap }) => ({
    ...state,
    evaluationMap,
  })),

  on(StudentDataActions.loadEvaluationStatusFailure, (state, { error }) => ({
    ...state,
    error,
  })),

  on(StudentDataActions.selectClassForEvaluation, (state, { selectedClass }) => ({
    ...state,
    selectedClass,
  })),

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

  on(StudentDataActions.resetEvaluationMap, (state) => ({
    ...state,
    evaluationMap: {},
  })),
);

export const createStudentLoadsKey = (
  studentId: string,
  page: number,
  size: number,
  sort: string,
): string => `${studentId}-${page}-${size}-${sort}`;
