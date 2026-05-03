import { createFeatureSelector, createSelector } from '@ngrx/store';
import { StudentDataState } from './student-data.state';

export const selectStudentDataState = createFeatureSelector<StudentDataState>('studentData');

export const selectStudentDataCache = createSelector(
  selectStudentDataState,
  (state) => state.cache,
);

export const selectStudentDataLoadsByKey = (key: string) =>
  createSelector(selectStudentDataCache, (cache) => cache[key]);

export const selectStudentDataLoading = createSelector(
  selectStudentDataState,
  (state) => state.loading,
);

export const selectEvaluationMap = createSelector(
  selectStudentDataState,
  (state) => state.evaluationMap,
);

export const selectSelectedClass = createSelector(
  selectStudentDataState,
  (state) => state.selectedClass,
);

export const selectEvaluationMapSize = createSelector(
  selectEvaluationMap,
  (map) => Object.keys(map).length,
);


export const selectStudentLoads = createSelector(
  selectStudentDataCache,
  (cache) =>
    Object.values(cache).flatMap((entry: any) => entry.content || [])
);

export const selectStudentLoadsWithEvaluation = createSelector(
  selectStudentLoads,
  selectEvaluationMap,
  (loads, map) =>
    loads.map((load) => {
      const key = `${load.facultyId}-${load.classCode}-${load.semester}-${load.schoolYear}`;

      return {
        ...load,
        isEvaluated: map[key] ?? null,
      };
    })
);