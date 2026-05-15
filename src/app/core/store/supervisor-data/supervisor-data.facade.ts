import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';

import * as SupervisorActions from './supervisor-data.actions';
import * as SupervisorSelectors from './supervisor-data.selectors';

import {
  FacultyClass,
  FacultyDTO,
  FacultyLoadDTO,
} from '../../services/supervisor-data/supervisor-data-service';

import { combineLatest, map, Observable } from 'rxjs';

import { EvaluationClass } from '../../services/evaluation/evaluation-service';

export type FacultyDashboardVM = {
  faculty: FacultyLoadDTO;
  classes: (FacultyClass & { isEvaluated: boolean })[];
  loading: boolean;
};

@Injectable({ providedIn: 'root' })
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

  /* ================= BASICS ================= */

  selectedClass$ = this.store.select(SupervisorSelectors.selectSelectedClass);

  faculties$(key: string): Observable<FacultyLoadDTO[]> {
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

  loadFaculties(key: string, program: string): void {
    this.store.dispatch(
      SupervisorActions.loadFaculties({
        key,
        program,
      }),
    );
  }

  /* ================= DASHBOARD VM ================= */

  facultyDashboard$(key: string): Observable<FacultyDashboardVM[]> {
    return combineLatest([
      this.faculties$(key),
      this.facultyClasses$(key),
      this.store.select(SupervisorSelectors.selectEvaluationStatusState),
    ]).pipe(
      map(([faculties, classMap, evalState]) => {
        const uniqueFaculties = faculties.filter(
          (faculty, index, self) =>
            index === self.findIndex((f) => f.facultyId === faculty.facultyId),
        );

        return uniqueFaculties.map((faculty) => {
          const entry = classMap?.[faculty.facultyId];

          const classes = (entry?.classes ?? []).map((c) => {
            const evaluationKey = this.buildEvaluationKey(
              c.classCode,
              c.subjectCode,
              c.yearLevel,
              c.semester,
              c.schoolYear,
            );

            const evaluated = evalState[key]?.classes?.[evaluationKey]?.evaluated ?? false;

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
        });
      }),
    );
  }

  /* ================= EVALUATION ================= */

  evaluationForClass$(key: string, evaluationKey: string) {
    return this.store.select(SupervisorSelectors.selectEvaluationForClass(key, evaluationKey));
  }

  isEvaluated$(key: string, evaluationKey: string) {
    return this.store.select(SupervisorSelectors.selectIsEvaluated(key, evaluationKey));
  }

  evaluationLoading$(key: string, evaluationKey: string) {
    return this.store.select(SupervisorSelectors.selectEvaluationLoading(key, evaluationKey));
  }

  evaluationError$(key: string, evaluationKey: string) {
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

  updateEvaluatedClass(key: string, evaluationKey: string): void {
    this.store.dispatch(
      SupervisorActions.updateEvaluatedClass({
        key,
        evaluationKey,
      }),
    );
  }

  /* ================= BATCH ================= */

  loadEvaluationStatusBatch(
    key: string,
    role: 'ROLE_STUDENT' | 'ROLE_DEAN',
    evaluatorId: string,
    payload: {
      facultyId: string;

      classCode: string;
      subjectCode: string;
      yearLevel: string;

      semester: string;
      schoolYear: number;
    }[],
  ): void {
    const transformedPayload = payload.map((p) => ({
      ...p,

      evaluationKey: this.buildEvaluationKey(
        p.classCode,
        p.subjectCode,
        p.yearLevel,
        p.semester,
        p.schoolYear,
      ),
    }));

    this.store.dispatch(
      SupervisorActions.loadEvaluationStatusBatch({
        key,
        role,
        evaluatorId,
        payload: transformedPayload,
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
}
