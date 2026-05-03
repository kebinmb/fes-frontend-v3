import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthFacade } from '../auth/auth.facade';
import * as StudentDataActions from './student-data.action';
import { selectSelectedClass, selectStudentLoads, selectStudentLoadsWithEvaluation } from './student-data.selectors';
import { StudentClassLoadDTO } from '../../services/student-data/student-data-service';
import { FacultyClass } from '../../services/supervisor-data/supervisor-data-service';
import { EvaluationClass } from '../../services/evaluation/evaluation-service';
@Injectable({
  providedIn: 'root',
})
export class StudentDataFacade {
  private store = inject(Store);
  private authFacade = inject(AuthFacade);
  isReady$ = this.store.select((state) => state.studentData.ready);
  isLoading$ = this.store.select((state) => state.studentData.loading);
  studentLoads$ = this.store.select(selectStudentLoadsWithEvaluation);
  selectedClass$ = this.store.select(selectSelectedClass);
  loadStudentLoads(studentId: string, page: number, size: number, sort: string) {
    this.store.dispatch(StudentDataActions.loadStudentLoads({ studentId, page, size, sort }));
  }
  loadEvaluationStatus(classes: any[], studentId: string): void {
    this.store.dispatch(StudentDataActions.loadEvaluationStatus({ classes, studentId }));
  }
  selectClassForEvaluation(selectedClass: EvaluationClass) {
    this.store.dispatch(StudentDataActions.selectStudentClassForEvaluation({ selectedClass }));
  }
}
