import { createAction, props } from "@ngrx/store";
import { PageResponse, StudentClassLoadDTO } from "../../services/student-data/student-data-service";

export const loadStudentLoads = createAction(
    '[Student Load] Load Student Loads',
    props<{ studentId: string, page: number, size: number, sort: string }>(),
);

export const loadStudentLoadsSuccess = createAction(
    '[Student Load] Load Student Loads Success',
    props<{
        key: string;
        response: PageResponse<StudentClassLoadDTO>
    }>()
);

export const loadStudentLoadsFailure = createAction(
    '[Student Load] Load Student Loads Failure',
    props<{ error: string }>()
);

export const loadEvaluationStatus = createAction(
    '[Student Evaluation] Load Evaluation State',
    props<{ classes: StudentClassLoadDTO[]; studentId: string }>()
);

export const loadEvaluationStatusSuccess = createAction(
    '[Student Evaluation] Load Evaluation Status Success',
    props<{ evaluationMap: Record<string, boolean | null> }>()
);

export const loadEvaluationStatusFailure = createAction(
    '[Student Evaluation] Load Evaluation Status Failure',
    props<{ error: string }>()
);

export const selectClassForEvaluation = createAction(
    '[Student Evaluation] Select Class For Evaluation',
    props<{ selectedClassKey: string }>()
);

export const updateStudentEvaluatedClass = createAction(
    '[Student Evaluation] Student Evaluated Class',
    props<{
        facultyId: string;
        classCode: string;
        semester: string;
        schoolYear: number;
    }>()
)

export const resetEvaluationMap = createAction(
    '[Student] Reset Evaluation Map'
);
