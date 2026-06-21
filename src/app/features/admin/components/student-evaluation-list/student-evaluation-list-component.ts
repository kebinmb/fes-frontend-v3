import { Component, OnInit, OnDestroy, inject } from '@angular/core';

import { CommonModule } from '@angular/common';

import { FormsModule } from '@angular/forms';

import { Subject, debounceTime, takeUntil, finalize, take } from 'rxjs';

import { AdminDataFacade } from '@core/store/admin-data/admin-data.facade';

import { StudentSectionEvaluationDTO } from '@core/services/admin/admin-service';
import { Actions, ofType } from '@ngrx/effects';
import * as AdminDataActions from '@core/store/admin-data/admin-data.actions';
@Component({
  selector: 'app-student-evaluation-list-component',

  standalone: true,

  imports: [CommonModule, FormsModule],

  templateUrl: './student-evaluation-list-component.html',

  styleUrl: './student-evaluation-list-component.css',
})
export class StudentEvaluationListComponent implements OnInit, OnDestroy {
  private adminFacade = inject(AdminDataFacade);

  private destroy$ = new Subject<void>();

  private filterSubject = new Subject<void>();
  private actions$ = inject(Actions);
  Math = Math;

  studentSections: StudentSectionEvaluationDTO[] = [];

  totalElements = 0;

  pageSize = 10;

  currentPage = 0;

  loading = false;

  isRequesting = false;

  filters = {
    programCode: '',

    yearLevel: '',

    sectionCode: '',
  };
  selectedRow: StudentSectionEvaluationDTO | null = null;
  ngOnInit(): void {
    this.initializeSubscriptions();

    this.initializeFilterDebounce();

    this.loadStudentSections();
  }

  ngOnDestroy(): void {
    this.destroy$.next();

    this.destroy$.complete();
  }
  printSection(row: StudentSectionEvaluationDTO): void {
    this.adminFacade.loadStudentEvaluationStatus(
      row.programCode,

      row.yearLevel,

      row.sectionCode,
    );

    this.actions$
      .pipe(
        ofType(AdminDataActions.loadStudentEvaluationStatusSuccess),

        take(1),
      )
      .subscribe(({ response }) => {
        const normalizedData = response.map((item) => ({
          studentId: item.studentId,

          programCode: item.programCode,

          yearLevel: item.yearLevel,

          sectionCode: item.sectionCode,

          subjectCode: item.subjectCode,

          createdAt: item.createdAt ?? '-',

          evaluationStatus: item.evaluationStatus,
        }));

        localStorage.setItem(
          'student-evaluation-print-data',

          JSON.stringify(normalizedData),
        );

        window.open(
          '/print/student-evaluation',

          '_blank',
        );
      });
  }
  private initializeSubscriptions(): void {
    this.adminFacade.studentSections$.pipe(takeUntil(this.destroy$)).subscribe((response) => {
      if (!response) {
        this.studentSections = [];

        this.totalElements = 0;

        this.isRequesting = false;

        return;
      }

      this.studentSections = response.content ?? [];

      this.totalElements = response.totalElements ?? 0;

      this.isRequesting = false;
    });

    this.adminFacade.loading$.pipe(takeUntil(this.destroy$)).subscribe((loading) => {
      this.loading = loading;

      if (!loading) {
        this.isRequesting = false;
      }
    });
  }

  private initializeFilterDebounce(): void {
    this.filterSubject.pipe(debounceTime(300), takeUntil(this.destroy$)).subscribe(() => {
      this.loadStudentSections();
    });
  }

  loadStudentSections(): void {
    if (this.isRequesting) {
      return;
    }

    this.isRequesting = true;

    this.adminFacade.loadStudentSections(
      this.currentPage,
      this.pageSize,
      this.normalizeFilter(this.filters.programCode),
      this.normalizeFilter(this.filters.yearLevel),
      this.normalizeFilter(this.filters.sectionCode),
    );
  }

  applyFilters(): void {
    if (this.isRequesting) {
      return;
    }

    this.currentPage = 0;

    this.filterSubject.next();
  }

  clearFilters(): void {
    if (this.isRequesting) {
      return;
    }

    this.filters = {
      programCode: '',

      yearLevel: '',

      sectionCode: '',
    };

    this.currentPage = 0;

    this.filterSubject.next();
  }

  previousPage(): void {
    if (this.currentPage <= 0 || this.isRequesting) {
      return;
    }

    this.currentPage--;

    this.loadStudentSections();
  }

  nextPage(): void {
    const totalPages = Math.ceil(this.totalElements / this.pageSize);

    if (this.currentPage + 1 >= totalPages || this.isRequesting) {
      return;
    }

    this.currentPage++;

    this.loadStudentSections();
  }
  onPageSizeChange(event: Event): void {
    if (this.isRequesting) {
      return;
    }

    const target = event.target as HTMLSelectElement;

    this.pageSize = Number(target.value);

    this.currentPage = 0;

    this.loadStudentSections();
  }

  private normalizeFilter(value: string): string {
    return value?.trim() || '';
  }

  trackBySection(index: number, row: StudentSectionEvaluationDTO): string {
    return `${row.programCode}-${row.yearLevel}-${row.sectionCode}`;
  }

  get totalPages(): number {
    return Math.ceil(this.totalElements / this.pageSize);
  }

  get showingStart(): number {
    if (this.totalElements === 0) {
      return 0;
    }

    return this.currentPage * this.pageSize + 1;
  }

  get showingEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }
}
