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
  (state) => state.selectedClassKey,
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