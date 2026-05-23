import { Injectable, inject } from '@angular/core';

import { Store } from '@ngrx/store';

import { Observable } from 'rxjs';

import {
  loadStudentEvaluations,
  clearStudentEvaluations,
} from './student-evaluation-data.action';

import {
  selectStudentEvaluations,
  selectStudentEvaluationLoading,
  selectStudentEvaluationError,
  selectStudentEvaluationTotalElements,
  selectStudentEvaluationTotalPages,
} from './student-evaluation-data.selector';

import {
  StudentFacultyEvaluationDTO,
} from '../../services/admin/admin-service';
import { Page } from '../../services/evaluation/evaluation-service';

@Injectable({
  providedIn: 'root',
})
export class StudentEvaluationFacade {

  private store = inject(Store);

  studentEvaluations$:
    Observable<Page<StudentFacultyEvaluationDTO> | null> =
    this.store.select(
      selectStudentEvaluations,
    );

  loading$:
    Observable<boolean> =
    this.store.select(
      selectStudentEvaluationLoading,
    );

  error$:
    Observable<string | null> =
    this.store.select(
      selectStudentEvaluationError,
    );

  totalElements$:
    Observable<number> =
    this.store.select(
      selectStudentEvaluationTotalElements,
    );

  totalPages$:
    Observable<number> =
    this.store.select(
      selectStudentEvaluationTotalPages,
    );

  loadStudentEvaluations(
    page: number = 0,
    size: number = 10,
    search: string = '',
    sortBy: string = 'created_at',
    sortDirection: 'asc' | 'desc' = 'desc',
  ): void {

    this.store.dispatch(
      loadStudentEvaluations({
        page,
        size,
        search,
        sortBy,
        sortDirection,
      }),
    );
  }

  clearStudentEvaluations(): void {

    this.store.dispatch(
      clearStudentEvaluations(),
    );
  }
}