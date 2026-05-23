import { StudentFacultyEvaluationDTO } from "../../services/admin/admin-service";
import { Page } from "../../services/evaluation/evaluation-service";

export interface StudentEvaluationState {
    studentEvaluations: Page<StudentFacultyEvaluationDTO> | null;
    loading: boolean;
    error: string | null;
}

export const initialStudentEvaluationState: StudentEvaluationState = {
    studentEvaluations: null,
    loading: false,
    error: null,
};