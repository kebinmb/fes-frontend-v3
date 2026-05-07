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
}
export const initialAdminState: AdminState = {
  faculties: null,
  userAccounts: null,
  facultyEvaluationScores: null,
  facultyEvaluationScoresByFacultyId: null,
  updateFacultyMessage: null,
  loading: false,
  error: null,
};
