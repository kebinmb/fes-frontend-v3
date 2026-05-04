import { createAction, props } from "@ngrx/store";
import { EvaluationDataContext } from "./evaluation.state";
import { EvaluationResponse, SubjectEvaluationDTO } from "../../services/evaluation/evaluation-service";

export const setEvaluationContext = createAction(
    '[Evaluation] Set Context',
    props<{ evaluationDataContext: EvaluationDataContext }>()
);

export const checkEvaluationStatus = createAction(
    '[Evaluation] Check Evaluation Status'
);

export const checkEvaluationStatusSuccess = createAction(
    '[Evaluation] Check Evaluation Status Success',
    props<{ hasEvaluated: boolean }>()
);

export const checkEvaluationStatusFailure = createAction(
    '[Evaluation] Check Evaluation Status Failure',
    props<{ error: string }>()
);

export const submitEvaluation = createAction(
    '[Evaluation] Submit Evaluation',
    props<{ payload: SubjectEvaluationDTO }>()
);

export const submitEvaluationSuccess = createAction(
    '[Evaluation] Submit Evaluation Success',
    props<{ response: EvaluationResponse }>()
);

export const submitEvaluationFailure = createAction(
    '[Evaluation] Submit Evaluation Failure',
    props<{ error: string }>()
);

export const initializeEvaluation = createAction(
    '[Evaluation] Initialize Evaluation Data'
);
export const resetEvaluationState = createAction('[Evaluation] Reset State');

