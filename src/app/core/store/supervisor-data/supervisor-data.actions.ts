import { createAction, props } from "@ngrx/store";
import { FacultyDTO, FacultyClass } from "../../services/supervisor-data/supervisor-data-service";

/* =====================================================
   FACULTY LIST
===================================================== */

export const loadFaculties = createAction(
  '[Faculty Data] Load Faculties',
  props<{
    key: string; // e.g. `${college}-${status}`
    college: string;
    status: string;
  }>()
);

export const loadFacultiesSuccess = createAction(
  '[Faculty Data] Load Faculties Success',
  props<{
    key: string;
    response: FacultyDTO[];
  }>()
);

export const loadFacultiesFailure = createAction(
  '[Faculty Data] Load Faculties Failure',
  props<{
    key: string;
    error: any;
  }>()
);


/* =====================================================
   FACULTY CLASSES
===================================================== */

export const loadFacultyClasses = createAction(
  '[Faculty Classes Data] Load Faculty Classes',
  props<{
    key: string; // e.g. facultyId
    facultyId: string;
  }>()
);

export const loadFacultyClassesSuccess = createAction(
  '[Faculty Classes Data] Load Faculty Classes Success',
  props<{
    key: string;
    data: {
      facultyId: string;
      classes: FacultyClass[];
    };
  }>()
);

export const loadFacultyClassesFailure = createAction(
  '[Faculty Classes Data] Load Faculty Classes Failure',
  props<{
    key: string;
    facultyId: string; // ✅ ADD THIS
    error: string;
  }>()
);


/* =====================================================
   EVALUATION STATUS
===================================================== */

export interface EvaluationContext {
  facultyId: string;
  evaluatorId: string;
  classCode: string;
  semester: string;
  schoolYear: number;
}

export interface EvaluationStatus {
  classCode: string;
  evaluated: boolean | null;
}

export const loadEvaluationStatus = createAction(
  '[Faculty Evaluation Status] Load Evaluation Status',
  props<{
    key: string; // e.g. `${facultyId}-${evaluatorId}-${semester}-${schoolYear}`
    role: 'ROLE_STUDENT' | 'ROLE_DEAN' | null;
    context: EvaluationContext;
  }>()
);

export const loadEvaluationStatusSuccess = createAction(
  '[Evaluation] Load Evaluation Status Success',
  props<{
    key: string;
    classCode: string;
    evaluated: boolean;
  }>()
);

export const loadEvaluationStatusFailure = createAction(
  '[Evaluation] Load Evaluation Status Failure',
  props<{
    key: string;
    classCode: string;
    error: string;
  }>()
);


/* =====================================================
   LOCAL STATE UPDATES
===================================================== */

export const updateEvaluatedClass = createAction(
  '[Faculty Evaluation Status] Update Evaluated Class',
  props<{
    key: string;
    facultyId: string;
    classCode: string;
    semester: string;
    schoolYear: number;
    evaluatorId: string;
  }>()
);

export const selectClassForEvaluation = createAction(
  '[Faculty Evaluation] Select Class For Evaluation',
  props<{
    selectedClass: FacultyClass;
  }>()
);