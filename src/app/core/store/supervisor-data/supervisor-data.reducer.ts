import { createReducer, on } from '@ngrx/store';
import * as SupervisorActions from './supervisor-data.actions';
import { SupervisorDataState, supervisorDataInitialState } from './supervisor-data.state';

export const supervisorDataReducer = createReducer(
    supervisorDataInitialState,
    on(SupervisorActions.loadFaculties, (state, { key }) => ({
        ...state,
        faculties: {
            ...state.faculties,
            [key]: {
                data: [],
                loading: true,
                error: null
            }
        }
    })),
    on(SupervisorActions.loadFacultiesSuccess, (state, { key, response }) => ({
        ...state,
        faculties: {
            ...state.faculties,
            [key]: {
                data: response,
                loading: false,
                error: null
            }
        }
    })),
    on(SupervisorActions.loadFacultiesFailure, (state, { key, error }) => ({
        ...state,
        faculties: {
            ...state.faculties,
            [key]: {
                data: [],
                loading: false,
                error
            }
        }
    })),
    on(SupervisorActions.loadFacultyClasses, (state, { key, facultyId }) => ({
        ...state,
        facultyClasses: {
            ...state.facultyClasses,
            [key]: {
                ...state.facultyClasses[key],
                [facultyId]: {
                    classes: state.facultyClasses[key]?.[facultyId]?.classes || [],
                    loading: true,
                    error: null
                }
            }
        }
    })),
    on(SupervisorActions.loadFacultyClassesSuccess, (state, { key, data }) => ({
        ...state,
        facultyClasses: {
            ...state.facultyClasses,
            [key]: {
                ...state.facultyClasses[key] || {},
                [data.facultyId]: {
                    classes: data.classes,
                    loading: false,
                    error: null
                }
            }
        }
    })),
    on(SupervisorActions.loadFacultyClassesFailure, (state, { key, facultyId, error }) => ({
        ...state,
        facultyClasses: {
            ...state.facultyClasses,
            [key]: {
                ...state.facultyClasses[key] || {},
                [facultyId]: {
                    classes: [],
                    loading: false,
                    error
                }
            }
        }
    })),
    on(SupervisorActions.loadEvaluationStatus, (state, { key, context }) => {
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

    on(SupervisorActions.loadEvaluationStatusSuccess, (state, { key, classCode, evaluated }) => {
        const existing = state.evaluationStatus[key];
        if (!existing) return state;

        return {
            ...state,
            evaluationStatus: {
                ...state.evaluationStatus,
                [key]: {
                    ...existing,
                    classes: {
                        ...existing.classes,
                        [classCode]: {
                            evaluated,
                            loading: false,
                            error: null
                        }
                    }
                }
            }
        };
    }),

    on(SupervisorActions.loadEvaluationStatusFailure, (state, { key, classCode, error }) => {
        const existing = state.evaluationStatus[key];
        if (!existing) return state;

        return {
            ...state,
            evaluationStatus: {
                ...state.evaluationStatus,
                [key]: {
                    ...existing,
                    classes: {
                        ...existing.classes,
                        [classCode]: {
                            evaluated: null,
                            loading: false,
                            error
                        }
                    }
                }
            }
        };
    }),
    on(SupervisorActions.updateEvaluatedClass, (state, { key, classCode }) => {
        const existing = state.evaluationStatus[key];
        if (!existing) return state;

        const classEntry = existing.classes[classCode];
        if (!classEntry) return state;

        return {
            ...state,
            evaluationStatus: {
                ...state.evaluationStatus,
                [key]: {
                    ...existing,
                    classes: {
                        ...existing.classes,
                        [classCode]: {
                            ...classEntry,
                            evaluated: true,
                            loading: false,
                            error: null
                        }
                    }
                }
            }
        };
    }),
    on(SupervisorActions.selectFacultyClassForEvaluation, (state, { selectedClass }) => ({
        ...state,
        selectedClass
    }))
);