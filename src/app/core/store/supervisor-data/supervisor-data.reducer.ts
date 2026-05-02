import { createReducer, on } from '@ngrx/store';
import * as Actions from './supervisor-data.actions';
import { supervisorDataInitialState } from './supervisor-data.state';

export const supervisorDataReducer = createReducer(
    supervisorDataInitialState,

    // FACULTIES
    on(Actions.loadFaculties, (state, { key }) => ({
        ...state,
        faculties: {
            ...state.faculties,
            [key]: { data: [], loading: true, error: null }
        }
    })),

    on(Actions.loadFacultiesSuccess, (state, { key, response }) => ({
        ...state,
        faculties: {
            ...state.faculties,
            [key]: { data: response, loading: false, error: null }
        }
    })),

    on(Actions.loadFacultiesFailure, (state, { key, error }) => ({
        ...state,
        faculties: {
            ...state.faculties,
            [key]: { data: [], loading: false, error }
        }
    })),

    // CLASSES (BATCH)
    on(Actions.loadAllFacultyClassesSuccess, (state, { key, results }) => {
        const map = results.reduce((acc, r) => {
            acc[r.facultyId] = {
                classes: r.classes,
                loading: false,
                error: null
            };
            return acc;
        }, {} as any);

        return {
            ...state,
            facultyClasses: {
                ...state.facultyClasses,
                [key]: map
            }
        };
    }),

    // EVALUATION
    on(Actions.loadEvaluationStatus, (state, { key, context }) => {
        const existing = state.evaluationStatus[key] || {
            facultyId: context.facultyId,
            evaluatorId: context.evaluatorId,
            semester: context.semester,
            schoolYear: context.schoolYear,
            classes: {}
        };

        return {
            ...state,
            evaluationStatus: {
                ...state.evaluationStatus,
                [key]: {
                    ...existing,
                    classes: {
                        ...existing.classes,
                        [context.classCode]: {
                            evaluated: null,
                            loading: true,
                            error: null
                        }
                    }
                }
            }
        };
    }),

    on(Actions.loadEvaluationStatusSuccess, (state, { key, classCode, evaluated }) => ({
        ...state,
        evaluationStatus: {
            ...state.evaluationStatus,
            [key]: {
                ...state.evaluationStatus[key],
                classes: {
                    ...state.evaluationStatus[key].classes,
                    [classCode]: { evaluated, loading: false, error: null }
                }
            }
        }
    })),

    on(Actions.loadEvaluationStatusFailure, (state, { key, classCode, error }) => ({
        ...state,
        evaluationStatus: {
            ...state.evaluationStatus,
            [key]: {
                ...state.evaluationStatus[key],
                classes: {
                    ...state.evaluationStatus[key].classes,
                    [classCode]: { evaluated: null, loading: false, error }
                }
            }
        }
    })),

    on(Actions.updateEvaluatedClass, (state, { key, classCode }) => ({
        ...state,
        evaluationStatus: {
            ...state.evaluationStatus,
            [key]: {
                ...state.evaluationStatus[key],
                classes: {
                    ...state.evaluationStatus[key].classes,
                    [classCode]: {
                        ...state.evaluationStatus[key].classes[classCode],
                        evaluated: true
                    }
                }
            }
        }
    })),

    on(Actions.selectFacultyClassForEvaluation, (state, { selectedClass }) => ({
        ...state,
        selectedClass
    })),
    // 🔥 ADD THIS (batch success)
    on(Actions.loadEvaluationStatusBatchSuccess, (state, { key, results }) => {
        const existing = state.evaluationStatus[key] || {
            facultyId: '',
            evaluatorId: '',
            semester: '',
            schoolYear: 0,
            classes: {}
        };

        const updatedClasses = results.reduce((acc, r) => {
            acc[r.classCode] = {
                evaluated: r.evaluated,
                loading: false,
                error: null
            };
            return acc;
        }, { ...existing.classes });

        return {
            ...state,
            evaluationStatus: {
                ...state.evaluationStatus,
                [key]: {
                    ...existing,
                    classes: updatedClasses
                }
            }
        };
    }),
    on(Actions.loadEvaluationStatusSuccess, (state, { key, classCode, evaluated }) => {
        const existing = state.evaluationStatus[key] || {
            facultyId: '',
            evaluatorId: '',
            semester: '',
            schoolYear: 0,
            classes: {}
        };
        return {
            ...state,
            evaluationStatus: {
                ...state.evaluationStatus,
                [key]: {
                    ...existing,
                    classes: {
                        ...existing.classes,
                        [classCode]: { evaluated, loading: false, error: null }
                    }
                }
            }
        };
    }),
);

