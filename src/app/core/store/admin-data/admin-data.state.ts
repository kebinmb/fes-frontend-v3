import {
  FetchFacultyEvaluationScoreResponse,
  FetchFacultyResponse,
  FetchUserAccountsResponse,
  PageResponse,
} from '../../services/admin/admin-service';
import { FacultyEvaluationScore } from '../../services/evaluation/evaluation-service';

export interface AdminState {
  faculties: PageResponse<FetchFacultyResponse> | null;
  userAccounts: PageResponse<FetchUserAccountsResponse> | null;
  facultyEvaluationScores: PageResponse<FetchFacultyEvaluationScoreResponse> | null;

  updateFacultyMessage: string | null;
  facultyEvaluationScoresByFacultyId: FacultyEvaluationScore[] | null;
  loading: boolean;
  error: any;

  createUserAccountMessage: string | null;

updateUserAccountMessage: string | null;

updateUserPasswordMessage: string | null;
}
export const initialAdminState: AdminState = {
  faculties: null,
  userAccounts: null,
  facultyEvaluationScores: null,
  facultyEvaluationScoresByFacultyId: null,

  updateFacultyMessage: null,

  createUserAccountMessage: null,

  updateUserAccountMessage: null,

  updateUserPasswordMessage: null,

  loading: false,

  error: null,
};
