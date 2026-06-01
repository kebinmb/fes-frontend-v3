import { EvaluationClass } from '../../services/evaluation/evaluation-service';
import {
  EvaluatedStudentsDTO,
  FacultyClass,
  FacultyDTO,
  FacultyLoadDTO,
} from '../../services/supervisor-data/supervisor-data-service';

export interface SupervisorDataState {
  faculties: {
    [key: string]: {
      data: FacultyLoadDTO[];

      totalElements: number;

      totalPages: number;

      page: number;

      size: number;

      loading: boolean;

      error: any;
    };
  };
  facultyClasses: {
    [key: string]: {
      [facultyId: string]: {
        classes: FacultyClass[];
        loading: boolean;
        error: string | null;
      };
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

  evaluatedStudents: {
    [key: string]: {
      data: EvaluatedStudentsDTO[];

      totalElements: number;

      totalPages: number;

      page: number;

      size: number;

      loading: boolean;

      error: any;
    };
  };

  showEvaluatedStudents: boolean;

  selectedClass: EvaluationClass | null;
}
export const supervisorDataInitialState: SupervisorDataState = {
  faculties: {},

  facultyClasses: {},

  evaluationStatus: {},

  selectedClass: null,
  evaluatedStudents: {},
   showEvaluatedStudents: false
};
