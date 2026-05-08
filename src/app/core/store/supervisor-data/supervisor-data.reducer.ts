import { createReducer, on } from '@ngrx/store';
import * as SupervisorDataActions from './supervisor-data.actions';
import { supervisorDataInitialState } from './supervisor-data.state';

const buildEvaluationKey = (
    classCode: string,
    subjectCode: string,
    yearLevel: string,
    semester: string,
    schoolYear: number
): string =>
    `${classCode}-${subjectCode}-${yearLevel}-${semester}-${schoolYear}`;

export const supervisorDataReducer = createReducer(

    supervisorDataInitialState,

    on(SupervisorDataActions.loadFaculties, (state, { key }) => ({
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

    on(SupervisorDataActions.loadFacultiesSuccess, (state, { key, response }) => ({
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

    on(SupervisorDataActions.loadFacultiesFailure, (state, { key, error }) => ({
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

    on(
        SupervisorDataActions.loadAllFacultyClassesSuccess,
        (state, { key, results }) => {

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
        }
    ),

    on(
        SupervisorDataActions.loadEvaluationStatus,
        (state, { key, context }) => {

            const existing = state.evaluationStatus[key] || {
                facultyId: context.facultyId,
                evaluatorId: context.evaluatorId,
                semester: context.semester,
                schoolYear: context.schoolYear,
                classes: {}
            };

            const evaluationKey = buildEvaluationKey(
                context.classCode,
                context.subjectCode,
                context.yearLevel,
                context.semester,
                context.schoolYear
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
                                error: null
                            }
                        }
                    }
                }
            };
        }
    ),

    on(
        SupervisorDataActions.loadEvaluationStatusSuccess,
        (state, { key, evaluationKey, evaluated }) => {

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
                            [evaluationKey]: {
                                evaluated,
                                loading: false,
                                error: null
                            }
                        }
                    }
                }
            };
        }
    ),

    on(
        SupervisorDataActions.loadEvaluationStatusFailure,
        (state, { key, evaluationKey, error }) => {

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
                            [evaluationKey]: {
                                evaluated: null,
                                loading: false,
                                error
                            }
                        }
                    }
                }
            };
        }
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
                            evaluated: true
                        }
                    }
                }
            }
        })
    ),

    on(
        SupervisorDataActions.selectFacultyClassForEvaluation,
        (state, { selectedClass }) => ({
            ...state,
            selectedClass
        })
    ),

    on(
        SupervisorDataActions.loadEvaluationStatusBatchSuccess,
        (state, { key, results }) => {

            const existing = state.evaluationStatus[key] || {
                facultyId: '',
                evaluatorId: '',
                semester: '',
                schoolYear: 0,
                classes: {}
            };

            const updatedClasses = results.reduce((acc, r) => {

                const evaluationKey = buildEvaluationKey(
                    r.classCode,
                    r.subjectCode,
                    r.yearLevel,
                    r.semester,
                    r.schoolYear
                );

                acc[evaluationKey] = {
                    evaluated: r.evaluated,
                    loading: false,
                    error: null
                };

                return acc;

            }, { ...existing.classes } as any);

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
        }
    ),

    on(
        SupervisorDataActions.resetSupervisorState,
        () => supervisorDataInitialState
    )
);