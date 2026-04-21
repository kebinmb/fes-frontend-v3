import { PageResponse, StudentClassLoadDTO } from "../../services/student-data/student-data-service"

export interface StudentDataState {
    cache: {
        [key: string]: PageResponse<StudentClassLoadDTO>
    }
    loading: boolean;
    error: any;
    evaluationMap: Record<string, boolean | null>;
    selectedClass: StudentClassLoadDTO | null;
}

export const initialStudentDataState: StudentDataState = {
    cache: {},
    loading: false,
    error: null,
    evaluationMap: {},
    selectedClass: null
}