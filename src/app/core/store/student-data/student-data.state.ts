import { PageResponse, StudentClassLoadDTO } from "../../services/student-data/student-data-service"

export interface StudentDataState {
    cache: {
        [key: string]: PageResponse<StudentClassLoadDTO>
    }
    loading: boolean;
    error: any;
    evaluationMap: Record<string, boolean | null>;
    selectedClassKey: string | null;
    ready: boolean;
}

export const initialStudentDataState: StudentDataState = {
    cache: {},
    loading: false,
    error: null,
    evaluationMap: {},
    selectedClassKey: null,
    ready: false,
}