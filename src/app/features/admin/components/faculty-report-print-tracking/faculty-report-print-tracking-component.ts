import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  FacultyEvaluationReportPrintStatusFilter,
  FacultyEvaluationReportPrintTrackingFilter,
  FacultyEvaluationReportPrintTrackingResponse,
} from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { repairSpecialCharacters } from '@utilities/normalize-text';
import { Subject, debounceTime, distinctUntilChanged, finalize } from 'rxjs';

type ReportStatusFilter = 'ALL' | 'VALID' | 'SUPERSEDED' | 'REVOKED';

@Component({
  selector: 'app-faculty-report-print-tracking-component',
  standalone: true,
  imports: [CommonModule, FormsModule, UnicodeTextPipe],
  templateUrl: './faculty-report-print-tracking-component.html',
  styleUrl: './faculty-report-print-tracking-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacultyReportPrintTrackingComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges$ = new Subject<string>();
  private requestId = 0;

  readonly rows = signal<FacultyEvaluationReportPrintTrackingResponse[]>([]);
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly selectedStatus = signal<ReportStatusFilter>('VALID');
  readonly selectedPrintStatus = signal<FacultyEvaluationReportPrintStatusFilter>('ALL');
  readonly selectedSchoolYear = signal<number | null>(null);
  readonly selectedSemester = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly totalElements = signal(0);
  readonly totalPages = signal(1);

  readonly pageSizes = [10, 25, 50, 100];
  readonly statusOptions: Array<{ label: string; value: ReportStatusFilter }> = [
    { label: 'Valid', value: 'VALID' },
    { label: 'All reports', value: 'ALL' },
    { label: 'Superseded', value: 'SUPERSEDED' },
    { label: 'Revoked', value: 'REVOKED' },
  ];
  readonly printStatusOptions: Array<{
    label: string;
    value: FacultyEvaluationReportPrintStatusFilter;
  }> = [
    { label: 'All print states', value: 'ALL' },
    { label: 'Report printed', value: 'REPORT_PRINTED' },
    { label: 'Report not printed', value: 'REPORT_NOT_PRINTED' },
    { label: 'Annex D printed', value: 'ANNEX_D_PRINTED' },
    { label: 'Annex D not printed', value: 'ANNEX_D_NOT_PRINTED' },
  ];
  readonly semesterOptions = [
    { label: 'Active term', value: '' },
    { label: '1st Semester', value: '1st' },
    { label: '2nd Semester', value: '2nd' },
    { label: 'Summer', value: 'summer' },
  ];

  readonly reportPrintedCount = computed(() =>
    this.rows().filter((row) => !!row.printedAt).length,
  );
  readonly annexPrintedCount = computed(() =>
    this.rows().filter((row) => !!row.annexDPrintedAt).length,
  );
  readonly pageStart = computed(() =>
    this.totalElements() ? this.pageIndex() * this.pageSize() + 1 : 0,
  );
  readonly pageEnd = computed(() =>
    Math.min(this.pageIndex() * this.pageSize() + this.rows().length, this.totalElements()),
  );

  ngOnInit(): void {
    this.searchChanges$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.resetAndLoad());

    this.loadDashboard();
  }

  loadDashboard(): void {
    const currentRequestId = ++this.requestId;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService
      .getFacultyEvaluationReportPrintTracking(
        this.pageIndex(),
        this.pageSize(),
        this.buildFilters(),
      )
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

          this.rows.set((response.content ?? []).map((row) => repairSpecialCharacters(row)));
          this.totalElements.set(response.totalElements ?? 0);
          this.totalPages.set(Math.max(response.totalPages ?? 1, 1));
          this.pageIndex.set(response.page ?? this.pageIndex());
          this.pageSize.set(response.size ?? this.pageSize());
          this.hasLoaded.set(true);
        },
        error: (error) => {
          if (currentRequestId !== this.requestId) {
            return;
          }

          const message = extractErrorMessage(error);
          this.rows.set([]);
          this.totalElements.set(0);
          this.totalPages.set(1);
          this.errorMessage.set(message);
          this.hasLoaded.set(true);
          this.toastFacade.showToast(message, 'error');
        },
      });
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value.replace(/\s+/g, ' ').slice(0, 90));
    this.searchChanges$.next(this.searchTerm().trim());
  }

  updateStatus(value: ReportStatusFilter): void {
    this.selectedStatus.set(value);
    this.resetAndLoad();
  }

  updatePrintStatus(value: FacultyEvaluationReportPrintStatusFilter): void {
    this.selectedPrintStatus.set(value);
    this.resetAndLoad();
  }

  updateSchoolYear(value: string | number | null): void {
    const year = Number(value);
    this.selectedSchoolYear.set(Number.isFinite(year) && year > 0 ? year : null);
    this.resetAndLoad();
  }

  updateSemester(value: string): void {
    this.selectedSemester.set(value);
    this.resetAndLoad();
  }

  updatePageSize(value: string | number): void {
    this.pageSize.set(Number(value) || 10);
    this.resetAndLoad();
  }

  goToPage(page: number): void {
    const nextPage = Math.min(Math.max(page, 0), this.totalPages() - 1);

    if (nextPage === this.pageIndex()) {
      return;
    }

    this.pageIndex.set(nextPage);
    this.loadDashboard();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedStatus.set('VALID');
    this.selectedPrintStatus.set('ALL');
    this.selectedSchoolYear.set(null);
    this.selectedSemester.set('');
    this.resetAndLoad();
  }

  hasActiveFilters(): boolean {
    return Boolean(
      this.searchTerm().trim() ||
        this.selectedStatus() !== 'ALL' ||
        this.selectedPrintStatus() !== 'ALL' ||
        this.selectedSchoolYear() ||
        this.selectedSemester(),
    );
  }

  trackByReportId(_: number, row: FacultyEvaluationReportPrintTrackingResponse): string {
    return row.reportId;
  }

  reportPrintLabel(row: FacultyEvaluationReportPrintTrackingResponse): string {
    return row.printedAt ? 'Printed' : 'Not printed';
  }

  annexPrintLabel(row: FacultyEvaluationReportPrintTrackingResponse): string {
    return row.annexDPrintedAt ? 'Printed Annex D' : 'Annex D not printed';
  }

  statusClass(status: string | null | undefined): string {
    return `status-${(status || 'unknown').toLowerCase()}`;
  }

  formatSemester(semester: string | null | undefined): string {
    return semester
      ? semester
          .toLowerCase()
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      : '-';
  }

  displayDate(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('en-PH', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  }

  shortReportId(reportId: string): string {
    return reportId ? reportId.slice(0, 8) : '-';
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.loadDashboard();
  }

  private buildFilters(): FacultyEvaluationReportPrintTrackingFilter {
    return {
      search: this.searchTerm(),
      status: this.selectedStatus(),
      printStatus: this.selectedPrintStatus(),
      schoolYear: this.selectedSchoolYear(),
      semester: this.selectedSemester(),
    };
  }
}
