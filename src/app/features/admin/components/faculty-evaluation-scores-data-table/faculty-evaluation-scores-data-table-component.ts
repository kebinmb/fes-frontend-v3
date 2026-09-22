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
  FacultyEvaluationGeneratedReportResponse,
  FacultyEvaluationReadinessFilter,
  FacultyEvaluationReadinessPageResponse,
  FacultyEvaluationReadinessResponse,
  FacultyEvaluationPrintResponse,
} from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { repairSpecialCharacters } from '@utilities/normalize-text';
import {
  Observable,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  from,
  map,
  mergeMap,
  of,
  take,
  toArray,
} from 'rxjs';

type FacultyEvaluationReadinessRow = FacultyEvaluationReadinessResponse;

interface FacultyEvaluationPrintRecord {
  facultyEvaluationScoreId: number;
  facultyId: string;
  college: string;
  position: string;
  facultyName?: string;
  evaluatorId?: string;
  evaluatorType?: string;
  classCode: string;
  sectionCode?: string;
  programCode?: string;
  semester?: string;
  schoolYear?: number;
  subjectCode?: string;
  yearLevel?: string;
  commentsOrFeedbacks?: string;
  overallAverageScore: number;
  overallInterpretation?: string;
  numberOfStudents?: number;
  numberOfSupervisors?: number;
  setRating?: number;
  sefRating?: number;
  studentComments?: string;
  supervisorComments?: string;
  supervisorName?: string;
  supervisorDesignation?: string;
}

type EvaluationCommentSource = {
  evaluatorType?: string | null;
  comments?: string | null;
  studentComments?: string | null;
  supervisorComments?: string | null;
};

type PrintableFacultyTarget = Partial<FacultyEvaluationReadinessRow> & {
  facultyId: string;
};

type PreparedPrintPayload = {
  report: Partial<FacultyEvaluationGeneratedReportResponse>;
  items: FacultyEvaluationPrintRecord[];
};

type PreparedReportSuccess = {
  row: PrintableFacultyTarget;
  payload: PreparedPrintPayload;
};

type PreparedReportFailure = {
  row: PrintableFacultyTarget;
  error: unknown;
};

type PreparedReportResult = PreparedReportSuccess | PreparedReportFailure;

type FacultyPrintMode = 'report' | 'annex';

@Component({
  selector: 'app-faculty-evaluation-scores-data-table-component',
  standalone: true,
  imports: [CommonModule, FormsModule, UnicodeTextPipe],
  templateUrl: './faculty-evaluation-scores-data-table-component.html',
  styleUrl: './faculty-evaluation-scores-data-table-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacultyEvaluationScoresDataTableComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchChanges$ = new Subject<string>();
  private requestId = 0;

  readonly rows = signal<FacultyEvaluationReadinessRow[]>([]);
  readonly isLoading = signal(false);
  readonly hasLoaded = signal(false);
  readonly errorMessage = signal('');
  readonly searchTerm = signal('');
  readonly selectedCollege = signal('');
  readonly selectedCampus = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);
  readonly isBulkPrinting = signal(false);
  readonly isBulkAnnexPrinting = signal(false);
  readonly printingFacultyId = signal<string | null>(null);
  readonly printingAnnexFacultyId = signal<string | null>(null);
  readonly selectedFacultyIds = signal<Set<string>>(new Set());
  readonly totalElements = signal(0);
  readonly totalPages = signal(1);
  readonly totalReadyFacultyCount = signal(0);
  readonly totalStudentEvaluationCount = signal(0);
  readonly totalSupervisorEvaluationCount = signal(0);
  readonly totalScoreRecords = signal(0);
  readonly summaryAverageOverallScore = signal<number | null>(null);

  readonly pageSizes = [10, 25, 50, 100];
  readonly collegeOptions = ['CAS', 'CIT', 'COED', 'COENG', 'CCS', 'CCJ', 'COF', 'CBMA'];
  readonly campusOptions = [
    { label: 'All Campuses', value: '' },
    { label: 'Talisay', value: 'LEGACY_TALISAY' },
    { label: 'Alijis', value: 'LEGACY_ALIJIS' },
    { label: 'Fortune-Towne', value: 'LEGACY_FT' },
    { label: 'Binalbagan', value: 'LEGACY_BINALBAGAN' },
  ];

  readonly filteredRows = computed(() => this.rows());
  readonly visibleRows = computed(() => this.rows());
  readonly pageStart = computed(() =>
    this.totalElements() ? this.pageIndex() * this.pageSize() + 1 : 0,
  );
  readonly pageEnd = computed(() =>
    Math.min(this.pageIndex() * this.pageSize() + this.rows().length, this.totalElements()),
  );
  readonly selectedRows = computed(() => {
    const selectedIds = this.selectedFacultyIds();

    return this.rows().filter((row) => selectedIds.has(row.facultyId));
  });
  readonly selectedCount = computed(() => this.selectedRows().length);
  readonly evaluatedFacultyCount = computed(() => this.totalReadyFacultyCount() || this.totalElements());
  readonly studentEvaluationCount = computed(() =>
    this.totalStudentEvaluationCount() ||
    this.rows().reduce((total, row) => total + row.studentEvaluationCount, 0),
  );
  readonly supervisorEvaluationCount = computed(() =>
    this.totalSupervisorEvaluationCount() ||
    this.rows().reduce((total, row) => total + row.supervisorEvaluationCount, 0),
  );
  readonly averageOverallScore = computed(() => {
    if (this.summaryAverageOverallScore() !== null) {
      return this.summaryAverageOverallScore();
    }

    const values = this.rows()
      .map((row) => row.overallAverage)
      .filter((value): value is number => value !== null);

    if (!values.length) {
      return null;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
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
    this.errorMessage.set('');

    this.adminService
      .getFacultyEvaluationReadiness(this.pageIndex(), this.pageSize(), this.buildFilters())
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

          const message = extractErrorMessage(error);

          this.rows.set([]);
          this.selectedFacultyIds.set(new Set());
          this.totalElements.set(0);
          this.totalPages.set(1);
          this.totalReadyFacultyCount.set(0);
          this.totalStudentEvaluationCount.set(0);
          this.totalSupervisorEvaluationCount.set(0);
          this.totalScoreRecords.set(0);
          this.summaryAverageOverallScore.set(null);
          this.errorMessage.set(message);
          this.hasLoaded.set(true);
          this.toastFacade.showToast(message, 'error');
        },
      });
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value.replace(/\s+/g, ' ').slice(0, 80));
    this.searchChanges$.next(this.searchTerm().trim());
  }

  updateCollege(value: string): void {
    this.selectedCollege.set(value);
    this.resetAndLoad();
  }

  updateCampus(value: string): void {
    this.selectedCampus.set(value);
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
    this.clearSelection();
    this.loadDashboard();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.selectedCollege.set('');
    this.selectedCampus.set('');
    this.resetAndLoad();
  }

  hasActiveFilters(): boolean {
    return Boolean(this.searchTerm().trim() || this.selectedCollege() || this.selectedCampus());
  }

  trackByFacultyId(_: number, row: FacultyEvaluationReadinessRow): string {
    return row.facultyId;
  }

  isSelected(facultyId: string): boolean {
    return this.selectedFacultyIds().has(facultyId);
  }

  toggleSelection(facultyId: string, checked: boolean): void {
    this.selectedFacultyIds.update((selectedIds) => {
      const next = new Set(selectedIds);

      if (checked) {
        next.add(facultyId);
      } else {
        next.delete(facultyId);
      }

      return next;
    });
  }

  toggleVisibleSelection(checked: boolean): void {
    this.selectedFacultyIds.update((selectedIds) => {
      const next = new Set(selectedIds);

      this.visibleRows().forEach((row) => {
        if (checked) {
          next.add(row.facultyId);
        } else {
          next.delete(row.facultyId);
        }
      });

      return next;
    });
  }

  clearSelection(): void {
    this.selectedFacultyIds.set(new Set());
  }

  areVisibleRowsSelected(): boolean {
    const rows = this.visibleRows();

    return rows.length > 0 && rows.every((row) => this.selectedFacultyIds().has(row.facultyId));
  }

  printSingle(row: FacultyEvaluationReadinessRow, mode: FacultyPrintMode = 'report'): void {
    if (this.printingFacultyId() || this.printingAnnexFacultyId()) {
      return;
    }

    const printWindow = this.openPreparingWindow(this.preparingMessage(mode, false));

    if (!printWindow) {
      return;
    }

    this.setPrintingFaculty(mode, row.facultyId);

    this.preparePrintableReport(row)
      .pipe(
        take(1),
        finalize(() => this.setPrintingFaculty(mode, null)),
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.toastFacade.showToast(
            `Unable to prepare ${row.facultyName}. ${extractErrorMessage(result.error)}`,
            'error',
          );
          printWindow.close();
          return;
        }

        this.trackPreparedPrints([result.payload], mode);
        localStorage.setItem('faculty-print-data', JSON.stringify({ mode, ...result.payload }));
        printWindow.location.href = '/print/faculty-evaluation';
        printWindow.focus();
      });
  }

  printBulk(mode: FacultyPrintMode = 'report'): void {
    if (this.isBulkPrinting() || this.isBulkAnnexPrinting()) {
      return;
    }

    if (!this.selectedRows().length && !this.totalElements()) {
      this.toastFacade.showToast('No print-ready faculty records are available.', 'error');
      return;
    }

    const printWindow = this.openPreparingWindow(this.preparingMessage(mode, true));

    if (!printWindow) {
      return;
    }

    this.setBulkPrinting(mode, true);

    if (!this.selectedRows().length) {
      this.prepareFilteredBulkReports(printWindow, mode);
      return;
    }

    const targets = this.selectedRows();

    from(targets)
      .pipe(
        mergeMap((row) => this.preparePrintableReport(row), 4),
        toArray(),
        take(1),
        finalize(() => this.setBulkPrinting(mode, false)),
      )
      .subscribe((results) => {
        const reports = results
          .filter((result): result is PreparedReportSuccess => this.isPreparedReportSuccess(result))
          .map((result) => result.payload)
          .filter((payload) => payload.items.length);

        if (!reports.length) {
          this.toastFacade.showToast(
            'No printable faculty evaluation reports were found.',
            'error',
          );
          printWindow.close();
          return;
        }

        localStorage.setItem('faculty-print-data', JSON.stringify({ mode, bulk: true, reports }));

        const skippedCount = results.length - reports.length;
        const skippedMessage = skippedCount
          ? ` ${skippedCount} faculty record(s) could not be prepared.`
          : '';

        this.trackPreparedPrints(reports, mode);
        this.toastFacade.showToast(
          `Prepared ${reports.length} ${mode === 'annex' ? 'Annex D form(s)' : 'faculty report(s)'}.${skippedMessage}`,
          'success',
        );

        printWindow.location.href = '/print/faculty-evaluation';
        printWindow.focus();
      });
  }

  displayCampus(row: FacultyEvaluationReadinessRow): string {
    const value = row.legacyDatabase || row.campus;

    return this.campusOptions.find((option) => option.value === value)?.label ?? value ?? '-';
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

  formatScore(value: number | null | undefined): string {
    return value === null || value === undefined ? '-' : value.toFixed(2);
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

  private isStudentEvaluation(record: FacultyEvaluationPrintResponse): boolean {
    const evaluatorType = this.safeText(record.evaluatorType).toUpperCase();

    return evaluatorType.includes('STUDENT')
      || evaluatorType === 'SET'
      || this.safeNumber(record.setRating) > 0;
  }

  private isSupervisorEvaluation(
    record: FacultyEvaluationPrintResponse,
  ): boolean {
    const evaluatorType = this.safeText(record.evaluatorType).toUpperCase();

    return evaluatorType.includes('SUPERVISOR')
      || evaluatorType.includes('DEAN')
      || evaluatorType.includes('PROGRAM_CHAIR')
      || evaluatorType === 'SEF'
      || this.safeNumber(record.numberOfSupervisors) > 0
      || this.safeNumber(record.sefRating) > 0;
  }

  private average(values: number[]): number | null {
    if (!values.length) {
      return null;
    }

    return values.reduce((total, value) => total + value, 0) / values.length;
  }

  private resetAndLoad(): void {
    this.pageIndex.set(0);
    this.selectedFacultyIds.set(new Set());
    this.loadDashboard();
  }

  private openPreparingWindow(message: string): Window | null {
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      this.toastFacade.showToast(
        'The print window was blocked. Please allow pop-ups for this site and try again.',
        'error',
      );
      return null;
    }

    printWindow.document.write(
      `<!doctype html><title>Preparing report...</title><body style="font-family: Arial, sans-serif; padding: 24px;">${message}</body>`,
    );
    printWindow.document.close();

    return printWindow;
  }

  private preparePrintableReport(row: PrintableFacultyTarget): Observable<PreparedReportResult> {
    return this.adminService.generateFacultyEvaluationReport(row.facultyId).pipe(
      map((report): PreparedReportResult => {
        if (!this.reportHasBothEvaluationTypes(report.items ?? [])) {
          throw new Error('The generated report does not include both student and supervisor evaluations.');
        }

        return {
          row,
          payload: this.toPrintPayload(report, row),
        };
      }),
      catchError((error) => of({ row, error } as PreparedReportFailure)),
    );
  }

  private prepareFilteredBulkReports(printWindow: Window, mode: FacultyPrintMode): void {
    this.adminService
      .getFacultyEvaluationReadinessFacultyIds(this.buildFilters())
      .pipe(
        take(1),
        mergeMap((facultyIds) => {
          const targets = facultyIds.map((facultyId) => ({ facultyId }));

          if (!targets.length) {
            return of([]);
          }

          return from(targets).pipe(
            mergeMap((target) => this.preparePrintableReport(target), 4),
            toArray(),
          );
        }),
        catchError((error) => {
          this.toastFacade.showToast(
            `Unable to prepare faculty reports. ${extractErrorMessage(error)}`,
            'error',
          );
          printWindow.close();

          return of([] as PreparedReportResult[]);
        }),
        finalize(() => this.setBulkPrinting(mode, false)),
      )
      .subscribe((results) => {
        const reports = results
          .filter((result): result is PreparedReportSuccess => this.isPreparedReportSuccess(result))
          .map((result) => result.payload)
          .filter((payload) => payload.items.length);

        if (!reports.length) {
          this.toastFacade.showToast(
            'No printable faculty evaluation reports were found for the current filters.',
            'error',
          );
          printWindow.close();
          return;
        }

        localStorage.setItem('faculty-print-data', JSON.stringify({ mode, bulk: true, reports }));

        const skippedCount = results.length - reports.length;
        const skippedMessage = skippedCount
          ? ` ${skippedCount} faculty record(s) were skipped.`
          : '';

        this.trackPreparedPrints(reports, mode);
        this.toastFacade.showToast(
          `Prepared ${reports.length} ${mode === 'annex' ? 'Annex D form(s)' : 'faculty report(s)'}.${skippedMessage}`,
          'success',
        );

        printWindow.location.href = '/print/faculty-evaluation';
        printWindow.focus();
      });
  }

  private reportHasBothEvaluationTypes(items: FacultyEvaluationPrintResponse[]): boolean {
    return items.some((item) => this.isStudentEvaluation(item))
      && items.some((item) => this.isSupervisorEvaluation(item));
  }

  private setPrintingFaculty(mode: FacultyPrintMode, facultyId: string | null): void {
    if (mode === 'annex') {
      this.printingAnnexFacultyId.set(facultyId);
    } else {
      this.printingFacultyId.set(facultyId);
    }
  }

  private setBulkPrinting(mode: FacultyPrintMode, isPrinting: boolean): void {
    if (mode === 'annex') {
      this.isBulkAnnexPrinting.set(isPrinting);
    } else {
      this.isBulkPrinting.set(isPrinting);
    }
  }

  private preparingMessage(mode: FacultyPrintMode, isBulk: boolean): string {
    if (mode === 'annex') {
      return isBulk
        ? 'Preparing Annex D forms...'
        : 'Preparing Annex D form...';
    }

    return isBulk
      ? 'Preparing faculty evaluation reports...'
      : 'Preparing faculty evaluation report...';
  }

  private isPreparedReportSuccess(result: PreparedReportResult): result is PreparedReportSuccess {
    return 'payload' in result;
  }

  private trackPreparedPrints(payloads: PreparedPrintPayload[], mode: FacultyPrintMode): void {
    const reportIds = payloads
      .map((payload) => this.safeText(payload.report?.reportId))
      .filter((reportId) => !!reportId);

    if (!reportIds.length) {
      return;
    }

    this.adminService
      .markFacultyEvaluationReportsPrinted(
        reportIds,
        mode === 'annex' ? 'ANNEX_D' : 'REPORT',
      )
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error) => {
          this.toastFacade.showToast(
            `The report was prepared, but print tracking was not updated. ${extractErrorMessage(error)}`,
            'error',
          );
        },
      });
  }

  private applyResponse(response: FacultyEvaluationReadinessPageResponse): void {
    this.rows.set(
      (response.content ?? []).map((row) => ({
        ...row,
        facultyId: this.safeText(row.facultyId),
        facultyName: this.safeText(row.facultyName, row.facultyId),
        college: this.safeText(row.college),
        position: this.safeText(row.position),
        legacyDatabase: this.safeText(row.legacyDatabase),
        campus: this.safeText(row.campus),
        schoolYear: this.safeNumber(row.schoolYear, 0) || null,
        semester: this.safeText(row.semester),
        subjects: Array.isArray(row.subjects) ? row.subjects.map((subject) => this.safeText(subject)).filter(Boolean) : [],
        studentEvaluationCount: this.safeNumber(row.studentEvaluationCount),
        supervisorEvaluationCount: this.safeNumber(row.supervisorEvaluationCount),
        totalScoreRecords: this.safeNumber(row.totalScoreRecords),
        setAverage: row.setAverage === null || row.setAverage === undefined ? null : this.safeNumber(row.setAverage),
        sefAverage: row.sefAverage === null || row.sefAverage === undefined ? null : this.safeNumber(row.sefAverage),
        overallAverage:
          row.overallAverage === null || row.overallAverage === undefined
            ? null
            : this.safeNumber(row.overallAverage),
        lastEvaluatedAt: this.safeText(row.lastEvaluatedAt),
      })),
    );
    this.totalElements.set(response.totalElements ?? 0);
    this.totalPages.set(Math.max(response.totalPages ?? 1, 1));
    this.pageIndex.set(response.page ?? this.pageIndex());
    this.pageSize.set(response.size ?? this.pageSize());
    this.totalReadyFacultyCount.set(response.totalReadyFacultyCount ?? response.totalElements ?? 0);
    this.totalStudentEvaluationCount.set(response.totalStudentEvaluationCount ?? 0);
    this.totalSupervisorEvaluationCount.set(response.totalSupervisorEvaluationCount ?? 0);
    this.totalScoreRecords.set(response.totalScoreRecordCount ?? 0);
    this.summaryAverageOverallScore.set(response.averageOverallScore ?? null);
    this.selectedFacultyIds.set(new Set());
  }

  private buildFilters(): FacultyEvaluationReadinessFilter {
    return {
      search: this.searchTerm(),
      college: this.selectedCollege(),
      campus: this.selectedCampus(),
      legacyDatabase: this.selectedCampus(),
    };
  }

  private toPrintPayload(
    report: FacultyEvaluationGeneratedReportResponse,
    fallback: Partial<FacultyEvaluationReadinessRow> = {},
  ): {
    report: Partial<FacultyEvaluationGeneratedReportResponse>;
    items: FacultyEvaluationPrintRecord[];
  } {
    return {
      report: {
        reportId: report.reportId,
        reportHash: report.reportHash,
        verificationUrl: this.frontendVerificationUrl(report.reportId, report.verificationUrl),
        qrCodeDataUri: report.qrCodeDataUri,
        versionNumber: report.versionNumber,
        status: report.status,
        generatedAt: report.generatedAt,
        generatedByUsername: report.generatedByUsername,
      },
      items: this.normalizePrintItems(report.items, fallback),
    };
  }

  private normalizePrintItems(
    items: FacultyEvaluationPrintResponse[] = [],
    fallback: Partial<FacultyEvaluationReadinessRow> = {},
  ): FacultyEvaluationPrintRecord[] {
    return items
      .filter((item) => !!item)
      .map((item) => {
        const separatedComments = this.separateEvaluationComments(item);

        return {
          facultyEvaluationScoreId: this.safeNumber(item.facultyEvaluationScoreId),
          facultyId: this.safeText(item.facultyId, fallback.facultyId),
          facultyName: this.safeText(item.facultyName, fallback.facultyName),
          evaluatorId: this.safeText(item.evaluatorId),
          evaluatorType: this.safeText(item.evaluatorType),
          classCode: this.safeText(item.classCode),
          programCode: this.safeText(item.programCode),
          sectionCode: this.safeText(item.sectionCode),
          college: this.safeText(item.college, fallback.college),
          position: this.safeText(item.position, fallback.position),
          semester: this.safeText(item.semester),
          schoolYear: this.safeNumber(item.schoolYear),
          subjectCode: this.safeText(item.subjectCode),
          yearLevel: this.safeText(item.yearLevel),
          commentsOrFeedbacks: separatedComments.commentsOrFeedbacks,
          studentComments: separatedComments.studentComments,
          supervisorComments: separatedComments.supervisorComments,
          overallAverageScore: this.safeNumber(item.overallAverageScore),
          overallInterpretation: this.safeText(item.overallInterpretation),
          numberOfStudents: this.safeNumber(item.numberOfStudents),
          numberOfSupervisors: this.safeNumber(item.numberOfSupervisors),
          setRating: this.safeNumber(item.setRating),
          sefRating: this.safeNumber(item.sefRating),
          supervisorName: this.safeText(item.supervisorName),
          supervisorDesignation: this.safeText(item.supervisorDesignation),
        };
      });
  }

  private separateEvaluationComments(item: EvaluationCommentSource): {
    commentsOrFeedbacks: string;
    studentComments: string;
    supervisorComments: string;
  } {
    const genericComment = this.formatPrintComment(item.comments);
    const studentComment = this.formatPrintComment(item.studentComments);
    const supervisorComment = this.formatPrintComment(item.supervisorComments);
    const evaluatorType = this.safeText(item.evaluatorType).toUpperCase();
    const isStudentEvaluation = evaluatorType.includes('STUDENT') || evaluatorType === 'SET';
    const isSupervisorEvaluation =
      evaluatorType.includes('SUPERVISOR') ||
      evaluatorType.includes('DEAN') ||
      evaluatorType.includes('PROGRAM_CHAIR') ||
      evaluatorType === 'SEF';

    return {
      commentsOrFeedbacks: genericComment,
      studentComments:
        studentComment !== '-' ? studentComment : isStudentEvaluation ? genericComment : '-',
      supervisorComments:
        supervisorComment !== '-' ? supervisorComment : isSupervisorEvaluation ? genericComment : '-',
    };
  }

  private formatPrintComment(comment: string | null | undefined): string {
    const normalizedComment = comment
      ?.replace(/\r\n?/g, '\n')
      .split('\n')
      .map((line) => line.replace(/[ \t]+/g, ' ').trim())
      .filter(Boolean)
      .join('\n')
      .trim();

    return normalizedComment && normalizedComment !== '-' ? normalizedComment : '-';
  }

  private frontendVerificationUrl(
    reportId: string | null | undefined,
    fallbackUrl: string | null | undefined,
  ): string {
    const resolvedReportId = this.safeText(reportId) || this.reportIdFromVerificationUrl(fallbackUrl);

    if (!resolvedReportId) {
      return this.safeText(fallbackUrl);
    }

    return `${window.location.origin}/verify-report/${encodeURIComponent(resolvedReportId)}`;
  }

  private reportIdFromVerificationUrl(url: string | null | undefined): string {
    const text = this.safeText(url);

    if (!text) {
      return '';
    }

    const match = text.match(/\/verify-report\/([^/?#]+)/);

    return match?.[1] ? decodeURIComponent(match[1]) : '';
  }

  private safeText(value: unknown, fallback: unknown = ''): string {
    const fallbackText =
      fallback === null || fallback === undefined ? '' : String(fallback).trim();

    if (value === null || value === undefined) {
      return fallbackText;
    }

    const text = repairSpecialCharacters(String(value)).trim();

    return text && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'undefined'
      ? text
      : fallbackText;
  }

  private safeNumber(value: unknown, fallback = 0): number {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }
}
