export interface EvaluationDataContext {
    facultyId: string;
    classCode: string;
    subjectCode: string;
    semseter: string;
    schoolYear: number;
    facultyName?: string;
    subjectDescription?: string;
    college: string;
    yearLevel: string;
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