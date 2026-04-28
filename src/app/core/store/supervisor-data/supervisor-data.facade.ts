import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import * as SupervisorActions from './supervisor-data.actions';
import * as SupervisorSelectors from './supervisor-data.selectors';
import { FacultyClass, FacultyDTO } from '../../services/supervisor-data/supervisor-data-service';
import { combineLatest, map, Observable } from 'rxjs';

/* =========================
   VIEW MODEL TYPE
========================= */

export type FacultyDashboardVM = {
  faculty: FacultyDTO;
  classes: (FacultyClass & { isEvaluated: boolean })[];
  loading: boolean;
};

@Injectable({ providedIn: 'root' })
export class SupervisorDataFacade {
  private store = inject(Store);
  faculties$(key: string): Observable<FacultyDTO[]> {
    return this.store.select(SupervisorSelectors.selectFacultyDataByKey(key));
  }

  facultiesLoading$(key: string): Observable<boolean> {
    return this.store.select(SupervisorSelectors.selectFacultyDataLoading(key));
  }
  facultiesError$(key: string): Observable<any> {
    return this.store.select(SupervisorSelectors.selectFacultyDataError(key));
  }
  loadFaculties(key: string, college: string, status: string): void {
    this.store.dispatch(SupervisorActions.loadFaculties({ key, college, status }));
  }
  facultyClasses$(key: string) {
    return this.store.select(SupervisorSelectors.selectFacultyClassesDataByKey(key));
  }
  facultyClassesLoading$(key: string) {
    return this.store.select(SupervisorSelectors.selectFacultyClassesDataLoading(key));
  }
  facultyDashboard$(key: string): Observable<FacultyDashboardVM[]> {
    return combineLatest([
      this.faculties$(key),
      this.store.select(SupervisorSelectors.selectFacultyClassesDataByKey(key)),
    ]).pipe(
      map(([faculties, classMap]) =>
        faculties.map((faculty) => {
          const entry = classMap?.[faculty.facultyId];

          return {
            faculty,
            classes: (entry?.classes ?? []).map((c) => ({
              ...c,
              isEvaluated: false,
            })),
            loading: entry?.loading ?? true,
          };
        }),
      ),
    );
  }
  loadFacultyClasses(key: string, facultyId: string): void {
    this.store.dispatch(SupervisorActions.loadFacultyClasses({ key, facultyId }));
  }
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
    },
  ): void {
    this.store.dispatch(SupervisorActions.loadEvaluationStatus({ key, role, context }));
  }
  updateEvaluatedClass(
    key: string,
    classCode: string,
    facultyId: string,
    evaluatorId: string,
    semester: string,
    schoolYear: number,
  ): void {
    this.store.dispatch(
      SupervisorActions.updateEvaluatedClass({
        key,
        classCode,
        facultyId,
        evaluatorId,
        semester,
        schoolYear,
      }),
    );
  }
  selectedClass$ = this.store.select(SupervisorSelectors.selectSelectedClass);

  selectClass(selectedClass: FacultyClass): void {
    this.store.dispatch(SupervisorActions.selectClassForEvaluation({ selectedClass }));
  }
}
