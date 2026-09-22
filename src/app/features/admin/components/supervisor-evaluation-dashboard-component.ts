import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  SupervisorEvaluationDashboardFilter,
  SupervisorEvaluationDashboardPageResponse,
  SupervisorEvaluationDashboardResponse,
  SupervisorEvaluationStatusFilter,
} from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

interface Option<T extends string = string> {
  label: string;
  value: T;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-supervisor-evaluation-dashboard-component',
  standalone: true,
  imports: [CommonModule, FormsModule, UnicodeTextPipe],
  templateUrl: './supervisor-evaluation-dashboard-component.html',
  styleUrl: './supervisor-evaluation-dashboard-component.css',
})
export class SupervisorEvaluationDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges$ = new Subject<string>();
  private requestId = 0;

  readonly rows = signal<SupervisorEvaluationDashboardResponse[]>([]);
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);
  readonly searchTerm = signal('');
  readonly evaluationStatus = signal<SupervisorEvaluationStatusFilter>('ALL');
  readonly sourceDatabase = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly totalPages = signal(1);
  readonly totalFacultyCount = signal(0);
  readonly evaluatedFacultyCount = signal(0);
  readonly pendingFacultyCount = signal(0);
  readonly currentTermLabel = signal('Active term');

  readonly pageSizes = [10, 25, 50, 100];
  readonly statusOptions: Option<SupervisorEvaluationStatusFilter>[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Submitted', value: 'EVALUATED' },
    { label: 'Not Submitted', value: 'PENDING' },
  ];
  readonly sourceOptions: Option[] = [
    { label: 'All Campuses', value: '' },
    { label: 'Talisay', value: 'LEGACY_TALISAY' },
    { label: 'Alijis', value: 'LEGACY_ALIJIS' },
    { label: 'Fortune-Towne', value: 'LEGACY_FT' },
    { label: 'Binalbagan', value: 'LEGACY_BINALBAGAN' },
  ];

  readonly evaluatedCount = computed(() => {
    if (this.evaluationStatus() === 'EVALUATED') {
      return this.totalElements();
    }

    return this.evaluatedFacultyCount() || this.rows().filter((row) => row.supervisorEvaluated).length;
  });
  readonly pendingCount = computed(() => {
    if (this.evaluationStatus() === 'PENDING') {
      return this.totalElements();
    }

    return this.pendingFacultyCount() || this.rows().filter((row) => !row.supervisorEvaluated).length;
  });
  readonly pageStart = computed(() =>
    this.totalElements() === 0 ? 0 : this.pageIndex() * this.pageSize() + 1,
  );
  readonly pageEnd = computed(() =>
    Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalElements()),
  );
  readonly paginationPages = computed(() => {
    const total = Math.max(this.totalPages(), 1);
    const current = this.pageIndex();
    const start = Math.max(0, Math.min(current - 2, total - 5));
    const end = Math.min(total, start + 5);
    return Array.from({ length: end - start }, (_, index) => start + index);
  });
  readonly completionRate = computed(() => {
    const total = this.totalFacultyCount();
    return total ? Math.round((this.evaluatedFacultyCount() / total) * 100) : 0;
  });
  readonly hasActiveFilters = computed(() =>
    Boolean(
      this.searchTerm().trim()
      || this.evaluationStatus() !== 'ALL'
      || this.sourceDatabase().trim(),
    ),
  );
  readonly activeFilterSummary = computed(() => {
    const filters = [
      this.searchTerm().trim() ? `Search: ${this.searchTerm().trim()}` : '',
      this.evaluationStatus() !== 'ALL'
        ? `Status: ${this.statusLabel(this.evaluationStatus())}`
        : '',
      this.sourceDatabase().trim()
        ? `Campus: ${this.displaySource(this.sourceDatabase())}`
        : '',
    ].filter(Boolean);

    return filters.length ? filters.join(' | ') : 'Showing all supervisor evaluation records';
  });

  ngOnInit(): void {
    this.searchChanges$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.resetAndLoad());

    this.loadDashboard();
  }

  loadDashboard(): void {
    const currentRequestId = ++this.requestId;
    this.isLoading.set(true);

    this.adminService
      .getSupervisorEvaluationDashboard(this.pageIndex(), this.pageSize(), this.buildFilters())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          if (currentRequestId === this.requestId) {
            this.isLoading.set(false);
          }
        }),
      )
      .subscribe({
        next: (response) => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.applyResponse(response);
          this.hasLoaded.set(true);
        },
        error: (error) => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          this.rows.set([]);
          this.totalElements.set(0);
          this.totalPages.set(1);
          this.totalFacultyCount.set(0);
          this.evaluatedFacultyCount.set(0);
          this.pendingFacultyCount.set(0);
          this.hasLoaded.set(true);
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.searchChanges$.next(value.trim());
  }

  updateEvaluationStatus(value: SupervisorEvaluationStatusFilter): void {
    this.evaluationStatus.set(value);
    this.resetAndLoad();
  }

  updateSourceDatabase(value: string): void {
    this.sourceDatabase.set(value);
    this.resetAndLoad();
  }

  updatePageSize(value: string | number): void {
    this.pageSize.set(Number(value) || 10);
    this.resetAndLoad();
  }

  goToPage(index: number): void {
    const nextPage = Math.min(Math.max(index, 0), this.totalPages() - 1);
    if (nextPage === this.pageIndex()) {
      return;
    }
    this.pageIndex.set(nextPage);
    this.loadDashboard();
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.evaluationStatus.set('ALL');
    this.sourceDatabase.set('');
    this.resetAndLoad();
  }

  trackByFacultyId(_: number, row: SupervisorEvaluationDashboardResponse): string {
    return row.facultyId;
  }

  hasSupervisorDetails(row: SupervisorEvaluationDashboardResponse): boolean {
    return [
      row.supervisorNames,
      row.supervisorIds,
      row.supervisorPositions,
    ].some((value) => !!value?.trim());
  }

  evaluationStatusLabel(row: SupervisorEvaluationDashboardResponse): string {
    return row.supervisorEvaluated ? 'Submitted' : 'Not submitted';
  }

  evaluationStatusHint(row: SupervisorEvaluationDashboardResponse): string {
    if (!row.supervisorEvaluated) {
      return 'No supervisor review yet';
    }

    if (!this.hasSupervisorDetails(row)) {
      return 'Submitted, evaluator details incomplete';
    }

    return `${row.supervisorEvaluationCount} review(s) submitted`;
  }

  supervisorDisplayName(row: SupervisorEvaluationDashboardResponse): string {
    if (row.supervisorNames?.trim()) {
      return row.supervisorNames;
    }

    if (row.supervisorIds?.trim()) {
      return `Evaluator ID ${row.supervisorIds}`;
    }

    return row.supervisorEvaluated ? 'Evaluator name unavailable' : 'No supervisor review';
  }

  supervisorDisplayId(row: SupervisorEvaluationDashboardResponse): string {
    if (row.supervisorIds?.trim()) {
      return row.supervisorNames?.trim()
        ? `ID: ${row.supervisorIds}`
        : 'Name was not included by the server';
    }

    return row.supervisorEvaluated ? 'Review record exists' : 'Waiting for submission';
  }

  supervisorDisplayPosition(row: SupervisorEvaluationDashboardResponse): string {
    if (row.supervisorPositions?.trim()) {
      return row.supervisorPositions;
    }

    return row.supervisorEvaluated
      ? 'Designation unavailable'
      : 'Details will appear after submission';
  }

  displaySource(value: string | null | undefined): string {
    return this.sourceOptions.find((option) => option.value === value)?.label ?? value ?? '-';
  }

  statusLabel(value: SupervisorEvaluationStatusFilter): string {
    return this.statusOptions.find((option) => option.value === value)?.label ?? value;
  }

  displayDate(value: string | null | undefined): string {
    if (!value) {
      return 'Not yet evaluated';
    }

    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  semesterLabel(semester: string | null | undefined): string {
    const labels: Record<string, string> = {
      FIRST_SEMESTER: 'First Semester',
      SECOND_SEMESTER: 'Second Semester',
      SUMMER_SEMESTER: 'Summer Semester',
    };
    return semester ? labels[semester] ?? semester : '-';
  }

  private buildFilters(): SupervisorEvaluationDashboardFilter {
    return {
      search: this.searchTerm(),
      evaluationStatus: this.evaluationStatus(),
      legacyDatabase: this.sourceDatabase(),
      campus: this.sourceDatabase(),
    };
  }

  private applyResponse(response: SupervisorEvaluationDashboardPageResponse): void {
    this.rows.set(response.content ?? []);
    this.totalElements.set(response.totalElements ?? 0);
    this.totalPages.set(Math.max(response.totalPages ?? 1, 1));
    this.pageIndex.set(response.page ?? 0);
    this.pageSize.set(response.size ?? this.pageSize());
    this.totalFacultyCount.set(response.totalFacultyCount ?? response.totalElements ?? 0);
    this.evaluatedFacultyCount.set(response.evaluatedFacultyCount ?? 0);
    this.pendingFacultyCount.set(response.pendingFacultyCount ?? 0);

    const firstRow = response.content?.[0];
    if (firstRow) {
      this.currentTermLabel.set(
        `${firstRow.schoolYear} | ${this.semesterLabel(firstRow.semester)}`,
      );
    }
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.loadDashboard();
  }
}
