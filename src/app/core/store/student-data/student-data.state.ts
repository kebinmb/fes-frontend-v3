import { EvaluationClass } from "../../services/evaluation/evaluation-service";
import { PageResponse, StudentClassLoadDTO } from "../../services/student-data/student-data-service"

export interface StudentDataState {
    cache: {
        [key: string]: PageResponse<StudentClassLoadDTO>
    }
    loading: boolean;
    error: any;
    evaluationMap: Record<string, boolean | null>;
    selectedClass: EvaluationClass | null;
    ready: boolean;
}

export const initialStudentDataState: StudentDataState = {
    cache: {},
    loading: false,
    error: null,
    evaluationMap: {},
    selectedClass: null,
    ready: false,
}