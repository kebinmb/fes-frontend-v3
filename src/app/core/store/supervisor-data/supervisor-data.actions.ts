import { createAction, props } from "@ngrx/store";
import { FacultyDTO, FacultyClass } from "../../services/supervisor-data/supervisor-data-service";
import { EvaluationClass } from "../../services/evaluation/evaluation-service";

/* ================= FACULTIES ================= */

export const loadFaculties = createAction(
  '[Faculty Data] Load Faculties',
  props<{ key: string; college: string; status: string }>()
);

export const loadFacultiesSuccess = createAction(
  '[Faculty Data] Load Faculties Success',
  props<{ key: string; response: FacultyDTO[] }>()
);

export const loadFacultiesFailure = createAction(
  '[Faculty Data] Load Faculties Failure',
  props<{ key: string; error: any }>()
);

/* ================= CLASSES (BATCH) ================= */

export const loadAllFacultyClasses = createAction(
  '[Faculty Classes Data] Load All Faculty Classes',
  props<{ key: string; faculties: FacultyDTO[] }>()
);

export const loadAllFacultyClassesSuccess = createAction(
  '[Faculty Classes Data] Load All Faculty Classes Success',
  props<{ key: string; results: { facultyId: string; classes: FacultyClass[] }[] }>()
);

export const loadAllFacultyClassesFailure = createAction(
  '[Faculty Classes Data] Load All Faculty Classes Failure',
  props<{ key: string; error: any }>()
);

/* ================= EVALUATION ================= */

export interface EvaluationContext {
  facultyId: string;
  evaluatorId: string;
  classCode: string;
  semester: string;
  schoolYear: number;
  subjectCode: string;
  college: string;
  yearLevel: number;
}

export const loadEvaluationStatus = createAction(
  '[Evaluation] Load Evaluation Status',
  props<{ key: string; role: 'ROLE_STUDENT' | 'ROLE_DEAN' | null; context: EvaluationContext }>()
);

export const loadEvaluationStatusSuccess = createAction(
  '[Evaluation] Load Evaluation Status Success',
  props<{ key: string; classCode: string; evaluated: boolean }>()
);

export const loadEvaluationStatusFailure = createAction(
  '[Evaluation] Load Evaluation Status Failure',
  props<{ key: string; classCode: string; error: string }>()
);

/* ================= LOCAL ================= */

export const updateEvaluatedClass = createAction(
  '[Evaluation] Update Evaluated Class',
  props<{ key: string; classCode: string }>()
);

export const selectFacultyClassForEvaluation = createAction(
  '[Evaluation] Select Class',
  props<{ selectedClass: EvaluationClass | null }>()
);

/* ================= EVALUATION (BATCH) ================= */

export const loadEvaluationStatusBatch = createAction(
  '[Evaluation] Load Evaluation Status Batch',
  props<{
    key: string;
    role: 'ROLE_STUDENT' | 'ROLE_DEAN';
    evaluatorId: string;
    payload: {
      facultyId: string;
      classCode: string;
      semester: string;
      schoolYear: number;
    }[];
  }>()
);

export const loadEvaluationStatusBatchSuccess = createAction(
  '[Evaluation] Load Evaluation Status Batch Success',
  props<{
    key: string;
    results: { classCode: string; evaluated: boolean }[];
  }>()
);

export const loadEvaluationStatusBatchFailure = createAction(
  '[Evaluation] Load Evaluation Status Batch Failure',
  props<{ key: string; error: any }>()
);