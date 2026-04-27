import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as SupervisorActions from './supervisor-data.actions';
import * as SupervisorSelectors from './supervisor-data.selectors';
import { FacultyClass } from '../../services/supervisor-data/supervisor-data-service';

@Injectable({ providedIn: 'root' })
export class SupervisorDataFacade {
  private store = inject(Store);

  /* =====================================================
     FACULTIES
  ===================================================== */

  faculties$(key: string) {
    return this.store.select(
      SupervisorSelectors.selectFacultyDataByKey(key)
    );
  }

  facultiesLoading$(key: string) {
    return this.store.select(
      SupervisorSelectors.selectFacultyDataLoading(key)
    );
  }

  facultiesError$(key: string) {
    return this.store.select(
      SupervisorSelectors.selectFacultyDataError(key)
    );
  }

  loadFaculties(key: string, college: string, status: string) {
    this.store.dispatch(
      SupervisorActions.loadFaculties({ key, college, status })
    );
  }

  /* =====================================================
     FACULTY CLASSES
  ===================================================== */

  facultyClasses$(key: string) {
    return this.store.select(
      SupervisorSelectors.selectFaucltyClassesDataByKey(key)
    );
  }

  facultyClassesLoading$(key: string) {
    return this.store.select(
      SupervisorSelectors.selectFacultyClassesDataLoading(key)
    );
  }

  loadFacultyClasses(key: string, facultyId: string) {
    this.store.dispatch(
      SupervisorActions.loadFacultyClasses({ key, facultyId })
    );
  }

  /* =====================================================
     EVALUATION STATUS
  ===================================================== */

  evaluationForClass$(key: string, classCode: string) {
    return this.store.select(
      SupervisorSelectors.selectEvaluationForClass(key, classCode)
    );
  }

  isEvaluated$(key: string, classCode: string) {
    return this.store.select(
      SupervisorSelectors.selectIsEvaluated(key, classCode)
    );
  }

  evaluationLoading$(key: string, classCode: string) {
    return this.store.select(
      SupervisorSelectors.selectEvaluationLoading(key, classCode)
    );
  }

  evaluationError$(key: string, classCode: string) {
    return this.store.select(
      SupervisorSelectors.selectEvaluationError(key, classCode)
    );
  }

  loadEvaluationStatus(
    key: string,
    role: 'ROLE_STUDENT' | 'ROLE_DEAN' | null,
    context: {
      facultyId: string;
      evaluatorId: string;
      classCode: string;
      semester: string;
      schoolYear: number;
    }
  ) {
    this.store.dispatch(
      SupervisorActions.loadEvaluationStatus({ key, role, context })
    );
  }

  updateEvaluatedClass(
    key: string,
    classCode: string,
    facultyId: string,
    evaluatorId: string,
    semester: string,
    schoolYear: number
  ) {
    this.store.dispatch(
      SupervisorActions.updateEvaluatedClass({
        key,
        classCode,
        facultyId,
        evaluatorId,
        semester,
        schoolYear
      })
    );
  }

  /* =====================================================
     SELECTED CLASS
  ===================================================== */

  selectedClass$ = this.store.select(
    SupervisorSelectors.selectSelectedClass
  );

  selectClass(selectedClass: FacultyClass) {
    this.store.dispatch(
      SupervisorActions.selectClassForEvaluation({ selectedClass })
    );
  }
}