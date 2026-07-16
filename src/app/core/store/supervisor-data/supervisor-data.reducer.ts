import { createReducer, on } from '@ngrx/store';

import * as SupervisorDataActions from './supervisor-data.actions';

import { supervisorDataInitialState } from './supervisor-data.state';
import { FacultyClass } from '../../services/supervisor-data/supervisor-data-service';

const buildEvaluationKey = (
  classCode: string,
  subjectCode: string,
  yearLevel: string,
  semester: string,
  schoolYear: number,
): string => `${classCode}-${subjectCode}-${yearLevel}-${semester}-${schoolYear}`;

const normalizeClassValue = (value: string | number | null | undefined): string =>
  `${value ?? ''}`.trim().toUpperCase();

const splitSectionCodes = (sectionCode: string | null | undefined): string[] =>
  `${sectionCode ?? ''}`
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

const mergeSectionCodes = (
  first: string | null | undefined,
  second: string | null | undefined,
): string => Array.from(new Set([...splitSectionCodes(first), ...splitSectionCodes(second)]))
  .sort((left, right) => left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' }))
  .join(', ');

const mergeClassValues = (
  first: string | null | undefined,
  second: string | null | undefined,
): string => mergeSectionCodes(first, second);

const buildFacultyClassGroupKey = (cls: FacultyClass): string =>
  [
    cls.facultyId,
    cls.subjectCode,
    cls.semester,
    cls.schoolYear,
  ]
    .map(normalizeClassValue)
    .join('|');

const deduplicateFacultyClasses = (classes: FacultyClass[]): FacultyClass[] => {
  const grouped = new Map<string, FacultyClass>();

  classes.forEach((cls) => {
    const groupKey = buildFacultyClassGroupKey(cls);
    const existing = grouped.get(groupKey);

    if (!existing) {
      grouped.set(groupKey, cls);
      return;
    }

    grouped.set(groupKey, {
      ...existing,
      classCode: existing.classCode || cls.classCode,
      programCode: mergeClassValues(existing.programCode, cls.programCode),
      yearLevel: mergeClassValues(existing.yearLevel, cls.yearLevel),
      sectionCode: mergeSectionCodes(existing.sectionCode, cls.sectionCode),
    });
  });

  return Array.from(grouped.values());
};

export const supervisorDataReducer = createReducer(
  supervisorDataInitialState,

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
            classes: deduplicateFacultyClasses(classes),

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

    (state, { key, evaluationKey }) => {
      const existingGroup = state.evaluationStatus[key];
      const existingClasses = existingGroup?.classes || {};

      return {
        ...state,

        evaluationStatus: {
          ...state.evaluationStatus,

          [key]: {
            facultyId: existingGroup?.facultyId || '',

            evaluatorId: existingGroup?.evaluatorId || '',

            semester: existingGroup?.semester || '',

            schoolYear: existingGroup?.schoolYear || 0,

            classes: {
              ...existingClasses,

              [evaluationKey]: {
                ...existingClasses[evaluationKey],

                evaluated: true,

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
    SupervisorDataActions.selectFacultyClassForEvaluation,

    (state, { selectedClass }) => ({
      ...state,

      selectedClass,
    }),
  ),
  on(
    SupervisorDataActions.clearFacultySelectionContext,

    (state, { key }) => {
      const remainingFacultyClasses = { ...state.facultyClasses };
      const remainingEvaluationStatus = { ...state.evaluationStatus };

      delete remainingFacultyClasses[key];
      delete remainingEvaluationStatus[key];

      return {
        ...state,

        selectedClass: null,

        facultyClasses: remainingFacultyClasses,

        evaluationStatus: remainingEvaluationStatus,
      };
    },
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
