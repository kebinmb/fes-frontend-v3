import { createAction, props } from "@ngrx/store";
import { Page } from "../../services/evaluation/evaluation-service";
import { StudentFacultyEvaluationDTO } from "../../services/admin/admin-service";

export const loadStudentEvaluations = createAction(
    '[Student Evaluation] Load Student Evaluations',
    props<{
        page?: number;
        size?: number;
        search?: string;
        sortBy?: string;
        sortDirection?: 'asc' | 'desc';
    }>(),
);

export const loadStudentEvaluationsSuccess = createAction(
    '[Student Evaluation] Load Student Evaluations Success',
    props<{
        response: Page<StudentFacultyEvaluationDTO>;
    }>(),
);

export const loadStudentEvaluationsFailure = createAction(
    '[Student Evaluation] Load Student Evaluations Failure',
    props<{
        error: string;
    }>(),
);

export const clearStudentEvaluations = createAction(
    '[Student Evaluation] Clear Student Evaluations',
);