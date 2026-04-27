import { FacultyClass, FacultyDTO } from "../../services/supervisor-data/supervisor-data-service"

export interface SupervisorDataState {
    faculties: {
        [key: string]: {
            data: FacultyDTO[];
            loading: boolean;
            error: any;
        };
    };

    facultyClasses: {
        [key: string]: {
            facultyId: string;
            classes: FacultyClass[];
            loading: boolean;
            error: string | null;
        };
    };

    evaluationStatus: {
        [key: string]: {
            facultyId: string;
            evaluatorId: string;
            semester: string;
            schoolYear: number;

            classes: {
                [classCode: string]: {
                    evaluated: boolean | null;
                    loading: boolean;
                    error: string | null;
                };
            };
        };
    };

    selectedClass: FacultyClass | null;
}

export const supervisorDataInitialState: SupervisorDataState = {
    faculties: {},
    facultyClasses: {},
    evaluationStatus: {},
    selectedClass: null
}