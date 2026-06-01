import { createReducer, on } from '@ngrx/store';

import * as SupervisorDataActions from './supervisor-data.actions';

import { supervisorDataInitialState } from './supervisor-data.state';

const buildEvaluationKey = (
  classCode: string,
  subjectCode: string,
  yearLevel: string,
  semester: string,
  schoolYear: number,
): string => `${classCode}-${subjectCode}-${yearLevel}-${semester}-${schoolYear}`;

export const supervisorDataReducer = createReducer(
  supervisorDataInitialState,

  /* ================= FACULTIES ================= */

  on(
    SupervisorDataActions.loadFaculties,

    (state, { key }) => ({
      ...state,

      faculties: {
        ...state.faculties,

        [key]: {
          data: [],

          totalElements: 0,

          totalPages: 0,

          page: 0,

          size: 10,

          loading: true,

          error: null,
        },
      },
    }),
  ),

  on(
    SupervisorDataActions.loadFacultiesSuccess,

    (state, { key, response }) => ({
      ...state,

      faculties: {
        ...state.faculties,

        [key]: {
          data: response.content,

          totalElements: response.totalElements,

          totalPages: response.totalPages,

          page: response.number,

          size: response.size,

          loading: false,

          error: null,
        },
      },
    }),
  ),

  on(
    SupervisorDataActions.loadFacultiesFailure,

    (state, { key, error }) => ({
      ...state,

      faculties: {
        ...state.faculties,

        [key]: {
          data: [],

          totalElements: 0,

          totalPages: 0,

          page: 0,

          size: 10,

          loading: false,

          error,
        },
      },
    }),
  ),

  /* ================= FACULTY CLASSES ================= */

  on(
    SupervisorDataActions.loadFacultyClasses,

    (state, { key, facultyId }) => ({
      ...state,

      facultyClasses: {
        ...state.facultyClasses,

        [key]: {
          ...state.facultyClasses[key],

          [facultyId]: {
            classes: [],

            loading: true,

            error: null,
          },
        },
      },
    }),
  ),

  on(
    SupervisorDataActions.loadFacultyClassesSuccess,

    (state, { key, facultyId, classes }) => ({
      ...state,

      facultyClasses: {
        ...state.facultyClasses,

        [key]: {
          ...state.facultyClasses[key],

          [facultyId]: {
            classes,

            loading: false,

            error: null,
          },
        },
      },
    }),
  ),

  on(
    SupervisorDataActions.loadFacultyClassesFailure,

    (state, { key, facultyId, error }) => ({
      ...state,

      facultyClasses: {
        ...state.facultyClasses,

        [key]: {
          ...state.facultyClasses[key],

          [facultyId]: {
            classes: [],

            loading: false,

            error,
          },
        },
      },
    }),
  ),

  /* ================= EVALUATION ================= */

  on(
    SupervisorDataActions.loadEvaluationStatus,

    (state, { key, context }) => {
      const existing = state.evaluationStatus[key] || {
        facultyId: context.facultyId,

        evaluatorId: context.evaluatorId,

        semester: context.semester,

        schoolYear: context.schoolYear,

        classes: {},
      };

      const evaluationKey = buildEvaluationKey(
        context.classCode,
        context.subjectCode,
        context.yearLevel,
        context.semester,
        context.schoolYear,
      );

      return {
        ...state,

        evaluationStatus: {
          ...state.evaluationStatus,

          [key]: {
            ...existing,

            classes: {
              ...existing.classes,

              [evaluationKey]: {
                evaluated: null,

                loading: true,

                error: null,
              },
            },
          },
        },
      };
    },
  ),

  on(
    SupervisorDataActions.loadEvaluationStatusSuccess,

    (state, { key, evaluationKey, evaluated }) => {
      const existing = state.evaluationStatus[key];

      return {
        ...state,

        evaluationStatus: {
          ...state.evaluationStatus,

          [key]: {
            ...existing,

            classes: {
              ...existing.classes,

              [evaluationKey]: {
                evaluated,

                loading: false,

                error: null,
              },
            },
          },
        },
      };
    },
  ),
  on(
    SupervisorDataActions.loadEvaluationStatusBatchSuccess,

    (state, { key, results }) => {
      const existingGroup = state.evaluationStatus[key];

      const existingClasses = existingGroup?.classes || {};

      const updatedClasses = {
        ...existingClasses,
      };

      results.forEach((result) => {
        updatedClasses[result.evaluationKey] = {
          evaluated: result.evaluated,

          loading: false,

          error: null,
        };
      });

      return {
        ...state,

        evaluationStatus: {
          ...state.evaluationStatus,

          [key]: {
            facultyId: existingGroup?.facultyId || '',

            evaluatorId: existingGroup?.evaluatorId || '',

            semester: existingGroup?.semester || '',

            schoolYear: existingGroup?.schoolYear || 0,

            classes: updatedClasses,
          },
        },
      };
    },
  ),
  on(
    SupervisorDataActions.loadEvaluationStatusFailure,

    (state, { key, evaluationKey, error }) => {
      const existing = state.evaluationStatus[key];

      return {
        ...state,

        evaluationStatus: {
          ...state.evaluationStatus,

          [key]: {
            ...existing,

            classes: {
              ...existing.classes,

              [evaluationKey]: {
                evaluated: null,

                loading: false,

                error,
              },
            },
          },
        },
      };
    },
  ),

  on(
    SupervisorDataActions.updateEvaluatedClass,

    (state, { key, evaluationKey }) => ({
      ...state,

      evaluationStatus: {
        ...state.evaluationStatus,

        [key]: {
          ...state.evaluationStatus[key],

          classes: {
            ...state.evaluationStatus[key].classes,

            [evaluationKey]: {
              ...state.evaluationStatus[key].classes[evaluationKey],

              evaluated: true,
            },
          },
        },
      },
    }),
  ),

  on(
    SupervisorDataActions.selectFacultyClassForEvaluation,

    (state, { selectedClass }) => ({
      ...state,

      selectedClass,
    }),
  ),
  on(
    SupervisorDataActions.loadEvaluationStatusBatch,

    (state, { key, payload, evaluatorId }) => {
      const existingGroup = state.evaluationStatus[key];

      const existingClasses = existingGroup?.classes || {};

      const updatedClasses = {
        ...existingClasses,
      };

      payload.forEach((item) => {
        updatedClasses[item.evaluationKey] = {
          evaluated: null,

          loading: true,

          error: null,
        };
      });

      return {
        ...state,

        evaluationStatus: {
          ...state.evaluationStatus,

          [key]: {
            facultyId: '',

            evaluatorId,

            semester: '',

            schoolYear: 0,

            classes: updatedClasses,
          },
        },
      };
    },
  ),
  on(
    SupervisorDataActions.resetSupervisorState,

    () => supervisorDataInitialState,
  ),
  on(
    SupervisorDataActions.loadEvaluatedStudents,

    (state, { key }) => ({
      ...state,

      evaluatedStudents: {
        ...state.evaluatedStudents,

        [key]: {
          data: [],

          totalElements: 0,

          totalPages: 0,

          page: 0,

          size: 10,

          loading: true,

          error: null,
        },
      },
    }),
  ),
  on(
    SupervisorDataActions.loadEvaluatedStudentsSuccess,

    (state, { key, response }) => ({
      ...state,

      evaluatedStudents: {
        ...state.evaluatedStudents,

        [key]: {
          data: response.content,

          totalElements: response.totalElements,

          totalPages: response.totalPages,

          page: response.number,

          size: response.size,

          loading: false,

          error: null,
        },
      },
    }),
  ),
  on(
    SupervisorDataActions.loadEvaluatedStudentsFailure,

    (state, { key, error }) => ({
      ...state,

      evaluatedStudents: {
        ...state.evaluatedStudents,

        [key]: {
          data: [],

          totalElements: 0,

          totalPages: 0,

          page: 0,

          size: 10,

          loading: false,

          error,
        },
      },
    }),
  ),
  on(
  SupervisorDataActions.showEvaluatedStudentsView,

  state => ({

    ...state,

    showEvaluatedStudents: true
  })
),

on(
  SupervisorDataActions.showDashboardView,

  state => ({

    ...state,

    showEvaluatedStudents: false
  })
),
);
