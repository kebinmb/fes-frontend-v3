import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StudentDataState } from './student-data.state';

export const selectStudentDataState = createFeatureSelector<StudentDataState>('studentData');

export const selectCache = createSelector(selectStudentDataState, (s) => s.cache);

export const selectEvaluationMap = createSelector(selectStudentDataState, (s) => s.evaluationMap);

export const selectSelectedClass = createSelector(selectStudentDataState, (s) => s.selectedClass);

export const selectStudentLoads = createSelector(selectCache, (cache) =>
  Object.values(cache).flatMap((c: any) => c.content || []),
);

export const selectIsFullyReady = createSelector(
  selectStudentDataState,
  (state) => state.loadsReady && state.evaluationReady,
);

export const selectStudentLoadsWithEvaluation = createSelector(
  selectStudentLoads,
  selectEvaluationMap,
  selectIsFullyReady,
  (loads, map, ready) => {
    if (!ready) return [];

    return loads.map((load) => {
      const key = `${load.facultyId}-${load.classCode}-${load.semester}-${load.schoolYear}`;

      return {
        ...load,
        isEvaluated: map[key] === true,
      };
    });
  },
);
