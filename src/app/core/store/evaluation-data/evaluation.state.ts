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
    evaluationDataContext: EvaluationDataContext | null;
    loading: boolean;
    submitting: boolean;
    hasEvaluated: boolean;
    error: string | null;
}

export const initialEvaluationDataState: EvaluationDataState = {
    evaluationDataContext: null,
    loading: false,
    submitting: false,
    hasEvaluated: false,
    error: null
}