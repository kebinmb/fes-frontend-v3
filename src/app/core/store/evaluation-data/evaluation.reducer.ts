import { createReducer, on } from '@ngrx/store';
import * as EvaluationActions from './evaluation.action';
import { initialEvaluationDataState } from './evaluation.state';

export const evaluationReducer = createReducer(
    initialEvaluationDataState,

    on(EvaluationActions.setEvaluationContext, (state, { evaluationDataContext }) => ({
        ...state,
        evaluationDataContext
    })),

    on(EvaluationActions.checkEvaluationState, (state) => ({
        ...state,
        loading: true
    })),

    on(EvaluationActions.checkEvaluationStatusSuccess, (state, { hasEvaluated }) => ({
        ...state,
        hasEvaluated,
        loading: false
    })),

    on(EvaluationActions.checkEvaluationStatusFailure, (state, { error }) => ({
        ...state,
        loading: false,
        error
    })),

    on(EvaluationActions.submitEvaluation, (state) => ({
        ...state,
        submitting: true
    })),

    on(EvaluationActions.submitEvaluationSuccess, (state) => ({
        ...state,
        submitting: false,
        hasEvaluated: true
    })),

    on(EvaluationActions.submitEvaluationFailure, (state, { error }) => ({
        ...state,
        submitting: false,
        error
    })),
);