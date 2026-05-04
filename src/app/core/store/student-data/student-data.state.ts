import { EvaluationClass } from '../../services/evaluation/evaluation-service';
import {
  PageResponse,
  StudentClassLoadDTO,
} from '../../services/student-data/student-data-service';

export interface StudentDataState {
  cache: Record<string, PageResponse<StudentClassLoadDTO>>;
  loading: boolean;
  error: string | null;
  evaluationMap: Record<string, boolean | null>;
  selectedClass: EvaluationClass | null;
  loadsReady: boolean;
  evaluationReady: boolean;
}

export const initialStudentDataState: StudentDataState = {
  cache: {},
  loading: false,
  error: null,
  evaluationMap: {},
  selectedClass: null,
  loadsReady: false,
  evaluationReady: false,
};
