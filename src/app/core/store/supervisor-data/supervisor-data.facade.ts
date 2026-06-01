import { Injectable, inject } from '@angular/core';

import { Store } from '@ngrx/store';

import * as SupervisorActions from './supervisor-data.actions';

import * as SupervisorSelectors from './supervisor-data.selectors';

import {
  FacultyClass,
  FacultyLoadDTO,
} from '../../services/supervisor-data/supervisor-data-service';

import { Observable } from 'rxjs';

import { EvaluationClass } from '../../services/evaluation/evaluation-service';

@Injectable({
  providedIn: 'root',
})
export class SupervisorDataFacade {
  private store = inject(Store);

  /* ================= HELPERS ================= */

  buildEvaluationKey(
    classCode: string,

    subjectCode: string,

    yearLevel: string,

    semester: string,

    schoolYear: number,
  ): string {
    return `${classCode}-${subjectCode}-${yearLevel}-${semester}-${schoolYear}`;
  }
  evaluatedStudents$(key: string) {
    return this.store.select(SupervisorSelectors.selectEvaluatedStudentsByKey(key));
  }
  evaluatedStudentsLoading$(key: string) {
    return this.store.select(SupervisorSelectors.selectEvaluatedStudentsLoading(key));
  }
  evaluatedStudentsPagination$(key: string) {
    return this.store.select(SupervisorSelectors.selectEvaluatedStudentsPagination(key));
  }
  loadEvaluatedStudents(
    key: string,

    page: number = 0,

    size: number = 10,

    sort: string = 'createdAt,desc',

    evaluatorId: string = '',
  ): void {
    this.store.dispatch(
      SupervisorActions.loadEvaluatedStudents({
        key,

        page,

        size,

        sort,

        evaluatorId,
      }),
    );
  }
  /* ================= BASICS ================= */

  selectedClass$ = this.store.select(SupervisorSelectors.selectSelectedClass);

  /* ================= FACULTIES ================= */

  faculties$(key: string): Observable<FacultyLoadDTO[]> {
    return this.store.select(SupervisorSelectors.selectFacultyDataByKey(key));
  }

  facultiesLoading$(key: string): Observable<boolean> {
    return this.store.select(SupervisorSelectors.selectFacultyDataLoading(key));
  }

  facultiesError$(key: string): Observable<any> {
    return this.store.select(SupervisorSelectors.selectFacultyDataError(key));
  }

  facultyPagination$(key: string) {
    return this.store.select(SupervisorSelectors.selectFacultyPagination(key));
  }

  /* ================= FACULTY CLASSES ================= */

  facultyClasses$(key: string) {
    return this.store.select(SupervisorSelectors.selectFacultyClassesDataByKey(key));
  }

  facultyClassesLoading$(key: string) {
    return this.store.select(SupervisorSelectors.selectFacultyClassesDataState);
  }

  /* ================= LOAD FACULTIES ================= */

  loadFaculties(
    key: string,

    program: string,

    userId: number,

    page: number = 0,

    size: number = 10,

    sort: string = 'lastname,asc',

    search: string = '',

    campus: string = '',
  ): void {
    this.store.dispatch(
      SupervisorActions.loadFaculties({
        key,

        program,

        userId,

        page,

        size,

        sort,

        search,

        campus,
      }),
    );
  }

  /* ================= LOAD FACULTY CLASSES ================= */

  loadFacultyClasses(
    key: string,

    facultyId: string,

    program: string,
  ): void {
    this.store.dispatch(
      SupervisorActions.loadFacultyClasses({
        key,

        facultyId,

        program,
      }),
    );
  }

  /* ================= EVALUATION ================= */

  evaluationForClass$(
    key: string,

    evaluationKey: string,
  ) {
    return this.store.select(SupervisorSelectors.selectEvaluationForClass(key, evaluationKey));
  }

  isEvaluated$(
    key: string,

    evaluationKey: string,
  ) {
    return this.store.select(SupervisorSelectors.selectIsEvaluated(key, evaluationKey));
  }

  evaluationLoading$(
    key: string,

    evaluationKey: string,
  ) {
    return this.store.select(SupervisorSelectors.selectEvaluationLoading(key, evaluationKey));
  }

  evaluationError$(
    key: string,

    evaluationKey: string,
  ) {
    return this.store.select(SupervisorSelectors.selectEvaluationError(key, evaluationKey));
  }

  loadEvaluationStatus(
    key: string,

    role: 'ROLE_STUDENT' | 'ROLE_DEAN' | null,

    context: {
      facultyId: string;

      evaluatorId: string;

      classCode: string;

      subjectCode: string;

      yearLevel: string;

      semester: string;

      schoolYear: number;

      college: string;
    },
  ): void {
    const evaluationKey = this.buildEvaluationKey(
      context.classCode,

      context.subjectCode,

      context.yearLevel,

      context.semester,

      context.schoolYear,
    );

    this.store.dispatch(
      SupervisorActions.loadEvaluationStatus({
        key,

        role,

        context: {
          ...context,

          evaluationKey,
        },
      }),
    );
  }

  updateEvaluatedClass(
    key: string,

    evaluationKey: string,
  ): void {
    this.store.dispatch(
      SupervisorActions.updateEvaluatedClass({
        key,

        evaluationKey,
      }),
    );
  }

  /* ================= SELECTION ================= */

  selectClass(selectedClass: EvaluationClass): void {
    this.store.dispatch(
      SupervisorActions.selectFacultyClassForEvaluation({
        selectedClass,
      }),
    );
  }

  /* ================= RESET ================= */

  resetState(): void {
    this.store.dispatch(SupervisorActions.resetSupervisorState());
  }
  showEvaluatedStudents$ = this.store.select(SupervisorSelectors.selectShowEvaluatedStudents);

  showEvaluatedStudentsView(): void {
    this.store.dispatch(SupervisorActions.showEvaluatedStudentsView());
  }

  showDashboardView(): void {
    this.store.dispatch(SupervisorActions.showDashboardView());
  }
}
