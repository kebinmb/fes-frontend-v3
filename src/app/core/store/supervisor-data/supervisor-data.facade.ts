import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as SupervisorActions from './supervisor-data.actions';
import * as SupervisorSelectors from './supervisor-data.selectors';
import { FacultyClass, FacultyDTO } from '../../services/supervisor-data/supervisor-data-service';
import { combineLatest, map, Observable } from 'rxjs';
import { EvaluationClass } from '../../services/evaluation/evaluation-service';

export type FacultyDashboardVM = {
  faculty: FacultyDTO;
  classes: (FacultyClass & { isEvaluated: boolean })[];
  loading: boolean;
};

@Injectable({ providedIn: 'root' })
export class SupervisorDataFacade {
  private store = inject(Store);

  /* ================= BASICS ================= */

  selectedClass$ = this.store.select(SupervisorSelectors.selectSelectedClass);

  faculties$(key: string): Observable<FacultyDTO[]> {
    return this.store.select(SupervisorSelectors.selectFacultyDataByKey(key));
  }

  facultiesLoading$(key: string): Observable<boolean> {
    return this.store.select(SupervisorSelectors.selectFacultyDataLoading(key));
  }

  facultiesError$(key: string): Observable<any> {
    return this.store.select(SupervisorSelectors.selectFacultyDataError(key));
  }

  facultyClasses$(key: string) {
    return this.store.select(SupervisorSelectors.selectFacultyClassesDataByKey(key));
  }

  facultyClassesLoading$(key: string) {
    return this.store.select(SupervisorSelectors.selectFacultyClassesDataLoading(key));
  }

  /* ================= LOAD ================= */

  loadFaculties(key: string, college: string, status: string): void {
    this.store.dispatch(SupervisorActions.loadFaculties({ key, college, status }));
  }

  /* ================= DASHBOARD VM ================= */

  facultyDashboard$(key: string): Observable<FacultyDashboardVM[]> {
    return combineLatest([
      this.faculties$(key),
      this.facultyClasses$(key),
      this.store.select(SupervisorSelectors.selectEvaluationStatusState),
    ]).pipe(
      map(([faculties, classMap, evalState]) =>
        faculties.map((faculty) => {
          const entry = classMap?.[faculty.facultyId];

          const classes = (entry?.classes ?? []).map((c) => {
            const evaluated =
              evalState[key]?.classes?.[c.classCode]?.evaluated ?? false;

            return {
              ...c,
              isEvaluated: evaluated,
            };
          });

          return {
            faculty,
            classes,
            loading: entry?.loading ?? false,
          };
        })
      )
    );
  }

  /* ================= EVALUATION ================= */

  evaluationForClass$(key: string, classCode: string) {
    return this.store.select(SupervisorSelectors.selectEvaluationForClass(key, classCode));
  }

  isEvaluated$(key: string, classCode: string) {
    return this.store.select(SupervisorSelectors.selectIsEvaluated(key, classCode));
  }

  evaluationLoading$(key: string, classCode: string) {
    return this.store.select(SupervisorSelectors.selectEvaluationLoading(key, classCode));
  }

  evaluationError$(key: string, classCode: string) {
    return this.store.select(SupervisorSelectors.selectEvaluationError(key, classCode));
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
      subjectCode: string;
      college: string;
      yearLevel: number;
    }
  ): void {
    this.store.dispatch(
      SupervisorActions.loadEvaluationStatus({ key, role, context })
    );
  }

  updateEvaluatedClass(
    key: string,
    classCode: string
  ): void {
    this.store.dispatch(
      SupervisorActions.updateEvaluatedClass({ key, classCode })
    );
  }

  /* ================= SELECTION ================= */

  selectClass(selectedClass: EvaluationClass): void {
    this.store.dispatch(
      SupervisorActions.selectFacultyClassForEvaluation({ selectedClass })
    );
  }
}