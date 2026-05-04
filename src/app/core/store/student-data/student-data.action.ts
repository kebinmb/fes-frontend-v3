import { createAction, props } from "@ngrx/store";
import { PageResponse, StudentClassLoadDTO } from "../../services/student-data/student-data-service";
import { EvaluationClass } from "../../services/evaluation/evaluation-service";

export const loadStudentLoads = createAction(
  '[Student] Load Loads',
  props<{ studentId: string; page: number; size: number; sort: string }>()
);

export const loadStudentLoadsSuccess = createAction(
  '[Student] Load Loads Success',
  props<{ key: string; response: PageResponse<StudentClassLoadDTO> }>()
);

export const loadStudentLoadsFailure = createAction(
  '[Student] Load Loads Failure',
  props<{ error: string }>()
);

export const loadEvaluationStatus = createAction(
  '[Student] Load Evaluation Status',
  props<{ classes: StudentClassLoadDTO[]; studentId: string }>()
);

export const loadEvaluationStatusSuccess = createAction(
  '[Student] Load Evaluation Status Success',
  props<{ evaluationMap: Record<string, boolean | null> }>()
);

export const loadEvaluationStatusFailure = createAction(
  '[Student] Load Evaluation Status Failure',
  props<{ error: string }>()
);

export const selectStudentClassForEvaluation = createAction(
  '[Student] Select Class',
  props<{ selectedClass: EvaluationClass | null }>()
);

export const updateStudentEvaluatedClass = createAction(
  '[Student] Mark Evaluated',
  props<{
    facultyId: string;
    classCode: string;
    semester: string;
    schoolYear: number;
  }>()
);

export const resetEvaluationMap = createAction(
  '[Student] Reset Evaluation Map'
);