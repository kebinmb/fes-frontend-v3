import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ClassStudentEvaluationStats,
  SupervisorDataService,
} from '@core/services/supervisor-data/supervisor-data-service';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';

@Component({
  selector: 'app-student-evaluation-stats-component',
  standalone: true,
  imports: [CommonModule, FormsModule, UnicodeTextPipe],
  templateUrl: './student-evaluation-stats-component.html',
  styleUrl: './student-evaluation-stats-component.css',
})
export class StudentEvaluationStatsComponent implements OnInit {
  private readonly supervisorDataService = inject(SupervisorDataService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly searchSubject = new Subject<string>();
  private readonly reloadSubject = new Subject<void>();

  readonly pageSizeOptions = [10, 20, 50];

  rows: ClassStudentEvaluationStats[] = [];
  loading = false;
  error: string | null = null;
  search = '';
  currentPage = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 0;

  ngOnInit(): void {
    this.reloadSubject
      .pipe(
        tap(() => {
          this.loading = true;
          this.error = null;
        }),
        switchMap(() =>
          this.supervisorDataService
            .getStudentEvaluationStats(
              this.currentPage,
              this.pageSize,
              this.search,
            )
            .pipe(
              map((response) => ({ response, error: null })),
              catchError((error) => of({ response: null, error })),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(({ response, error }) => {
        this.loading = false;

        if (error) {
          this.rows = [];
          this.totalElements = 0;
          this.totalPages = 0;
          this.error =
            error?.error?.message ??
            'Unable to load student evaluation statistics.';
          this.changeDetectorRef.detectChanges();
          return;
        }

        this.rows = (response?.content ?? []).map((row) => this.normalizeRow(row));
        this.totalElements = Number(response?.totalElements ?? 0);
        this.totalPages = Number(response?.totalPages ?? 0);
        this.changeDetectorRef.detectChanges();
      });

    this.searchSubject
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => {
        this.search = search;
        this.currentPage = 0;
        this.loadStats();
      });

    this.loadStats();
  }

  onSearch(event: Event): void {
    this.searchSubject.next((event.target as HTMLInputElement)?.value ?? '');
  }

  onPageSizeChange(size: number): void {
    this.pageSize = Number(size) || 10;
    this.currentPage = 0;
    this.loadStats();
  }

  reload(): void {
    this.loadStats();
  }

  previousPage(): void {
    if (this.currentPage <= 0) {
      return;
    }

    this.currentPage--;
    this.loadStats();
  }

  nextPage(): void {
    if (this.currentPage + 1 >= this.totalPages) {
      return;
    }

    this.currentPage++;
    this.loadStats();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;
    this.loadStats();
  }

  getPageNumbers(): number[] {
    const maxVisiblePages = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = start + maxVisiblePages;

    if (end > this.totalPages) {
      end = this.totalPages;
      start = Math.max(0, end - maxVisiblePages);
    }

    return Array.from({ length: end - start }, (_, index) => start + index);
  }

  trackRow(_: number, row: ClassStudentEvaluationStats): string {
    return `${row.classCode}-${row.facultyId}-${row.subjectCode}`;
  }

  displayCode(value: string): string {
    return this.stripCampusPrefix(value);
  }

  completionClass(row: ClassStudentEvaluationStats): string {
    const percentage = row.evaluationPercentage ?? 0;

    if (percentage >= 80) {
      return 'high';
    }

    if (percentage >= 50) {
      return 'medium';
    }

    return 'low';
  }

  completionLabel(row: ClassStudentEvaluationStats): string {
    const level = this.completionClass(row);

    if (level === 'high') {
      return 'On Track';
    }

    if (level === 'medium') {
      return 'Monitor';
    }

    return 'Needs Follow-up';
  }

  clearSearch(): void {
    if (!this.search) {
      return;
    }

    this.search = '';
    this.currentPage = 0;
    this.loadStats();
  }

  get evaluatedTotal(): number {
    return this.rows.reduce((total, row) => total + (row.evaluatedStudents ?? 0), 0);
  }

  get studentTotal(): number {
    return this.rows.reduce((total, row) => total + (row.totalStudents ?? 0), 0);
  }

  get averageCompletion(): number {
    return this.studentTotal ? Math.round((this.evaluatedTotal / this.studentTotal) * 100) : 0;
  }

  get rangeStart(): number {
    if (!this.totalElements || !this.rows.length) {
      return 0;
    }

    return this.currentPage * this.pageSize + 1;
  }

  get rangeEnd(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  private loadStats(): void {
    this.reloadSubject.next();
  }

  private normalizeRow(row: ClassStudentEvaluationStats): ClassStudentEvaluationStats {
    const totalStudents = this.toNumber(row.totalStudents);
    const evaluatedStudents = this.toNumber(row.evaluatedStudents);
    const pendingStudents = this.toNumber(row.pendingStudents);
    const evaluationPercentage = this.toNumber(row.evaluationPercentage);

    return {
      classCode: this.toText(row.classCode),
      facultyId: this.toText(row.facultyId),
      facultyName: this.toText(row.facultyName),
      subjectCode: this.toText(row.subjectCode),
      programCode: this.toText(row.programCode),
      yearLevel: this.toText(row.yearLevel),
      sectionCode: this.toText(row.sectionCode),
      totalStudents,
      evaluatedStudents,
      pendingStudents,
      evaluationPercentage,
    };
  }

  private toText(value: unknown): string {
    return value == null ? '' : String(value);
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private stripCampusPrefix(value: string): string {
    return value.replace(/^(FT|TAL|BIN|ALI)-/i, '').trim();
  }
}
