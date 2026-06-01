import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SupervisorDataState } from './supervisor-data.state';

export const selectSupervisorDataState =
  createFeatureSelector<SupervisorDataState>('supervisorData');

export const selectFacultiesState = createSelector(
  selectSupervisorDataState,
  (state) => state.faculties,
);

export const selectFacultyDataByKey = (key: string) =>
  createSelector(selectFacultiesState, (faculties) => faculties[key]?.data || []);

export const selectFacultyDataLoading = (key: string) =>
  createSelector(selectFacultiesState, (faculties) => faculties[key]?.loading || false);

export const selectFacultyDataError = (key: string) =>
  createSelector(selectFacultiesState, (faculties) => faculties[key]?.error || null);

export const selectFacultyClassesDataState = createSelector(
  selectSupervisorDataState,
  (state) => state.facultyClasses,
);
export const selectFacultyPagination = (key: string) =>
  createSelector(
    selectFacultiesState,

    (faculties) => ({
      totalElements: faculties[key]?.totalElements || 0,

      totalPages: faculties[key]?.totalPages || 0,

      page: faculties[key]?.page || 0,

      size: faculties[key]?.size || 10,
    }),
  );
export const selectFacultyClassesDataByKey = (key: string) =>
  createSelector(selectSupervisorDataState, (state) => state.facultyClasses[key] || {});
export const selectFacultyClassesDataLoading = (key: string) =>
  createSelector(selectFacultyClassesDataState, (state) =>
    Object.values(state[key] || {}).some((f) => f.loading),
  );
export const selectEvaluationStatusState = createSelector(
  selectSupervisorDataState,
  (state) => state.evaluationStatus,
);

export const selectEvaluationGroup = (key: string) =>
  createSelector(selectEvaluationStatusState, (state) => state[key] || null);

export const selectEvaluationForClass = (key: string, classCode: string) =>
  createSelector(selectEvaluationStatusState, (state) => state[key]?.classes?.[classCode] || null);

export const selectIsEvaluated = (key: string, classCode: string) =>
  createSelector(selectEvaluationForClass(key, classCode), (cls) => cls?.evaluated ?? null);

export const selectEvaluationLoading = (key: string, classCode: string) =>
  createSelector(selectEvaluationForClass(key, classCode), (cls) => cls?.loading ?? false);

export const selectEvaluationError = (key: string, classCode: string) =>
  createSelector(selectEvaluationForClass(key, classCode), (cls) => cls?.error ?? null);

export const selectSelectedClass = createSelector(
  selectSupervisorDataState,
  (state) => state.selectedClass,
);

export const selectEvaluatedStudentsState = createSelector(
  selectSupervisorDataState,
  (state) => state.evaluatedStudents,
);

export const selectEvaluatedStudentsByKey = (key: string) =>
  createSelector(selectEvaluatedStudentsState, (state) => state[key]?.data || []);

export const selectEvaluatedStudentsLoading = (key: string) =>
  createSelector(selectEvaluatedStudentsState, (state) => state[key]?.loading || false);

export const selectEvaluatedStudentsError = (key: string) =>
  createSelector(selectEvaluatedStudentsState, (state) => state[key]?.error || null);

export const selectEvaluatedStudentsPagination = (key: string) =>
  createSelector(
    selectEvaluatedStudentsState,

    (state) => ({
      totalElements: state[key]?.totalElements || 0,

      totalPages: state[key]?.totalPages || 0,

      page: state[key]?.page || 0,

      size: state[key]?.size || 10,
    }),
  );
export const selectShowEvaluatedStudents = createSelector(
  selectSupervisorDataState,

  (state) => state.showEvaluatedStudents,
);
