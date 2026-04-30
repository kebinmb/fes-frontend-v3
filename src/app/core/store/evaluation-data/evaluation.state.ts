export interface EvaluationDataContext {
    facultyId: string;
    classCode: string;
    subjectCode: string;
    semester: string;
    schoolYear: number;
    facultyName?: string;
    subjectDescription?: string;
    college: string;
    yearLevel: number;
}

export interface EvaluationDataState {
    context: EvaluationDataContext | null;
    loading: boolean;
    submitting: boolean;
    hasEvaluated: boolean;
    error: string | null;
}

export const initialEvaluationDataState: EvaluationDataState = {
    context: null,
    loading: false,
    submitting: false,
    hasEvaluated: false,
    error: null
}