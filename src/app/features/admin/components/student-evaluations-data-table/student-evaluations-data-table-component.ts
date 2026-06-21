import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  signal,
} from '@angular/core';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  takeUntil,
} from 'rxjs';

import {
  AsyncPipe,
  DatePipe,
} from '@angular/common';

import {
  StudentEvaluationFacade,
} from '@core/store/student-evaluation-data/student-evaluation-data.facade';

@Component({
  selector: 'app-student-evaluations-data-table',
  imports: [
    AsyncPipe,
    DatePipe,
  ],
  templateUrl:
    './student-evaluations-data-table-component.html',
  styleUrl:
    './student-evaluations-data-table-component.css',
})
export class StudentEvaluationsDataTableComponent
  implements OnInit, OnDestroy {

  private facade =
    inject(StudentEvaluationFacade);

  private destroy$ =
    new Subject<void>();

  private searchSubject =
    new Subject<string>();

  studentEvaluations$ =
    this.facade.studentEvaluations$;

  loading$ =
    this.facade.loading$;

  totalElements$ =
    this.facade.totalElements$;

  totalPages$ =
    this.facade.totalPages$;

  page = signal(0);

  size = signal(10);

  search = signal('');

  ngOnInit(): void {

    this.loadStudentEvaluations();

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {

        this.search.set(value);

        this.page.set(0);

        this.loadStudentEvaluations();
      });
  }

  ngOnDestroy(): void {

    this.destroy$.next();

    this.destroy$.complete();
  }

  loadStudentEvaluations(): void {

    this.facade.loadStudentEvaluations(
      this.page(),
      this.size(),
      this.search(),
      'created_at',
      'desc',
    );
  }

  onSearch(value: string): void {

    this.searchSubject.next(value);
  }

  nextPage(): void {

    this.totalPages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((totalPages) => {

        if (this.page() + 1 >= totalPages) {
          return;
        }

        this.page.update(v => v + 1);

        this.loadStudentEvaluations();
      });
  }

  previousPage(): void {

    if (this.page() === 0) {
      return;
    }

    this.page.update(v => v - 1);

    this.loadStudentEvaluations();
  }
}