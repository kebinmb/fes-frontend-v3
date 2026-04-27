import { createFeatureSelector, createSelector } from "@ngrx/store";
import { SupervisorDataState } from "./supervisor-data.state";

export const selectSupervisorDataState = createFeatureSelector<SupervisorDataState>('supervisorData');

export const selectFacultiesState = createSelector(
    selectSupervisorDataState,
    state => state.faculties
);

export const selectFacultyDataByKey = (key: string) =>
    createSelector(
        selectFacultiesState,
        faculties => faculties[key]?.data || []
    );

export const selectFacultyDataLoading = (key: string) =>
    createSelector(
        selectFacultiesState,
        faculties => faculties[key]?.loading || false
    );

export const selectFacultyDataError = (key: string) =>
    createSelector(
        selectFacultiesState,
        faculties => faculties[key]?.error || null
    );

export const selectFacultyClassesDataState = createSelector(
    selectSupervisorDataState,
    state => state.facultyClasses
);

export const selectFacultyClassesDataByKey = (key: string) =>
    createSelector(
        selectSupervisorDataState,
        state => state.facultyClasses[key] || {}
    );
export const selectFacultyClassesDataLoading = (key: string) =>
    createSelector(
        selectFacultyClassesDataState,
        state => {
            const facultyMap = state[key];
            if (!facultyMap) return false;

            return Object.values(facultyMap).some(f => f.loading);
        }
    );
export const selectEvaluationStatusState = createSelector(
    selectSupervisorDataState,
    state => state.evaluationStatus
);

export const selectEvaluationGroup = (key: string) =>
    createSelector(
        selectEvaluationStatusState,
        state => state[key] || null
    );

export const selectEvaluationForClass = (key: string, classCode: string) =>
    createSelector(
        selectEvaluationStatusState,
        state => state[key]?.classes?.[classCode] || null
    );

export const selectIsEvaluated = (key: string, classCode: string) =>
    createSelector(
        selectEvaluationForClass(key, classCode),
        cls => cls?.evaluated ?? null
    );

export const selectEvaluationLoading = (key: string, classCode: string) =>
    createSelector(
        selectEvaluationForClass(key, classCode),
        cls => cls?.loading ?? false
    );

export const selectEvaluationError = (key: string, classCode: string) =>
    createSelector(
        selectEvaluationForClass(key, classCode),
        cls => cls?.error ?? null
    );

export const selectSelectedClass = createSelector(
    selectSupervisorDataState,
    state => state.selectedClass
);