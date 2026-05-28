import { createAction, props } from '@ngrx/store';
import {
  CreateUserAccountRequest,
  FetchFacultyEvaluationScoreResponse,
  FetchFacultyResponse,
  FetchUserAccountsResponse,
  PageResponse,
  StudentSectionEvaluationDTO,
  UpdateFacultyRequest,
  UpdateUserAccountRequest,
  UpdateUserPasswordRequest,
} from '../../services/admin/admin-service';
import { FacultyEvaluationScore } from '../../services/evaluation/evaluation-service';

export const loadFaculties = createAction(
  '[Admin] Load Faculties',
  props<{
    page: number;
    size: number;
    search?: string;
  }>(),
);

export const loadFacultiesSuccess = createAction(
  '[Admin] Load Faculties Success',
  props<{ response: PageResponse<FetchFacultyResponse> }>(),
);

export const loadFacultiesFailure = createAction(
  '[Admin] Load Faculties Failure',
  props<{ error: any }>(),
);

export const loadUserAccounts = createAction(
  '[Admin] Load User Accounts',
  props<{ page: number; size: number }>(),
);

export const loadUserAccountsSuccess = createAction(
  '[Admin] Load User Accounts Success',
  props<{ response: PageResponse<FetchUserAccountsResponse> }>(),
);

export const loadUserAccountsFailure = createAction(
  '[Admin] Load User Accounts Failure',
  props<{ error: any }>(),
);

export const loadFacultyEvaluationScores = createAction(
  '[Admin] Load Faculty Evaluation Scores',
  props<{ page: number; size: number }>(),
);

export const loadFacultyEvaluationScoresSuccess = createAction(
  '[Admin] Load Faculty Evaluation Scores Success',
  props<{ response: PageResponse<FetchFacultyEvaluationScoreResponse> }>(),
);

export const loadFacultyEvaluationScoresFailure = createAction(
  '[Admin] Load Faculty Evaluation Scores Failure',
  props<{ error: any }>(),
);
export const updateFaculty = createAction(
  '[Admin] Update Faculty',
  props<{ payload: UpdateFacultyRequest }>(),
);

export const updateFacultySuccess = createAction(
  '[Admin] Update Faculty Success',
  props<{ response: string }>(),
);

export const updateFacultyFailure = createAction(
  '[Admin] Update Faculty Failure',
  props<{ error: any }>(),
);
export const createUserAccount = createAction(
  '[Admin] Create User Account',
  props<{ payload: CreateUserAccountRequest }>(),
);

export const createUserAccountSuccess = createAction(
  '[Admin] Create User Account Success',
  props<{ response: string }>(),
);

export const createUserAccountFailure = createAction(
  '[Admin] Create User Account Failure',
  props<{ error: any }>(),
);

export const updateUserAccount = createAction(
  '[Admin] Update User Account',
  props<{ payload: UpdateUserAccountRequest }>(),
);

export const updateUserAccountSuccess = createAction(
  '[Admin] Update User Account Success',
  props<{ response: string }>(),
);

export const updateUserAccountFailure = createAction(
  '[Admin] Update User Account Failure',
  props<{ error: any }>(),
);

export const updateUserPassword = createAction(
  '[Admin] Update User Password',
  props<{ payload: UpdateUserPasswordRequest }>(),
);

export const updateUserPasswordSuccess = createAction(
  '[Admin] Update User Password Success',
  props<{ response: string }>(),
);

export const updateUserPasswordFailure = createAction(
  '[Admin] Update User Password Failure',
  props<{ error: any }>(),
);
export const loadFacultyEvaluationScoresByFacultyId = createAction(
  '[Admin] Load Faculty Evaluation Scores By Faculty Id',

  props<{
    facultyId: string;
  }>(),
);

export const loadFacultyEvaluationScoresByFacultyIdSuccess = createAction(
  '[Admin] Load Faculty Evaluation Scores By Faculty Id Success',

  props<{
    response: FacultyEvaluationScore[];
  }>(),
);

export const loadFacultyEvaluationScoresByFacultyIdFailure = createAction(
  '[Admin] Load Faculty Evaluation Scores By Faculty Id Failure',

  props<{
    error: any;
  }>(),
);
export const loadStudentSections = createAction(
  '[Admin] Load Student Sections',
  props<{
    page: number;
    size: number;
    programCode?: string;
    yearLevel?: string;
    sectionCode?: string;
  }>(),
);

export const loadStudentSectionsSuccess = createAction(
  '[Admin] Load Student Sections Success',

  props<{
    response: PageResponse<StudentSectionEvaluationDTO>;
  }>(),
);
export const loadStudentSectionsFailure = createAction(
  '[Admin] Load Student Sections Failure',

  props<{
    error: any;
  }>(),
);
