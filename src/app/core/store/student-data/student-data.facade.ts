import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AuthFacade } from '../auth/auth.facade';
import * as StudentDataActions from './student-data.action';
import { selectStudentLoads } from './student-data.selectors';
@Injectable({
  providedIn: 'root',
})
export class StudentDataFacade {
  private store = inject(Store);
  private authFacade = inject(AuthFacade);
  isReady$ = this.store.select((state) => state.studentData.ready);
  isLoading$ = this.store.select((state) => state.studentData.loading);
  studentLoads$ = this.store.select(selectStudentLoads);
  loadStudentLoads(studentId: string, page: number, size: number, sort: string) {
    this.store.dispatch(StudentDataActions.loadStudentLoads({ studentId, page, size, sort }));
  }
}
