import { Injectable, inject } from '@angular/core';
import { Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { EvaluationClass } from '../../services/evaluation/evaluation-service';
import {
  selectStudentLoadsWithEvaluation,
  selectSelectedClass,
  selectIsFullyReady,
} from './student-data.selectors';
import * as StudentDataActions from './student-data.action';
@Injectable({ providedIn: 'root' })
export class StudentDataFacade {
  private store = inject(Store);

  isReady$ = this.store.select(selectIsFullyReady);
  isLoading$ = this.store.select((s) => s.studentData.loading);

  studentLoads$ = this.store.select(selectStudentLoadsWithEvaluation);
  selectedClass$ = this.store.select(selectSelectedClass);

  loadStudentLoads(studentId: string, page: number, size: number, sort: string) {
    this.store.dispatch(StudentDataActions.loadStudentLoads({ studentId, page, size, sort }));
  }

  selectClassForEvaluation(selectedClass: EvaluationClass) {
    this.store.dispatch(StudentDataActions.selectStudentClassForEvaluation({ selectedClass }));
  }
}
