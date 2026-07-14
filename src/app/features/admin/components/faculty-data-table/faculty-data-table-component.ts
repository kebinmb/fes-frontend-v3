import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AdminDataFacade } from '@core/store/admin-data/admin-data.facade';
import {
  AdminService,
  FacultyEvaluationGeneratedReportResponse,
  FacultyEvaluationPrintResponse,
  FetchFacultyResponse,
} from '@core/services/admin/admin-service';
import { AuthFacade } from '@core/store/auth/auth.facade';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  map,
  of,
  take,
} from 'rxjs';
import { repairSpecialCharacters } from '@utilities/normalize-text';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { ToastFacade } from '@core/store/toast/toast.facade';
export interface FacultyEvaluationPrintRecord {
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
  setRating?: number;
  sefRating?: number;
  studentComments?: string;
  supervisorComments?: string;
  supervisorName?: string;
  supervisorDesignation?: string;
}

type EvaluationCommentSource = {
  evaluatorType?: string;
  comments?: string | null;
  studentComments?: string | null;
  supervisorComments?: string | null;
};

type SeparatedEvaluationComments = {
  commentsOrFeedbacks: string;
  studentComments: string;
  supervisorComments: string;
};
@Component({
  selector: 'app-faculty-data-table-component',
  standalone: true,
  templateUrl: './faculty-data-table-component.html',
  styleUrl: './faculty-data-table-component.css',
  imports: [AsyncPipe, ReactiveFormsModule, FormsModule, UnicodeTextPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacultyDataTableComponent implements OnInit {
  private adminDataFacade = inject(AdminDataFacade);
  private adminService = inject(AdminService);
  private authFacade = inject(AuthFacade);
  private toastFacade = inject(ToastFacade);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);
  private cdr = inject(ChangeDetectorRef);
  private searchSubject = new Subject<string>();
  faculties$ = this.adminDataFacade.faculties$;
  role$ = this.authFacade.role$;
  isAdmin$ = this.role$.pipe(map((role) => role === 'ROLE_ADMIN'));
  loading$ = this.adminDataFacade.loading$;
  error$ = this.adminDataFacade.error$;
  updateFacultyMessage$ = this.adminDataFacade.updateFacultyMessage$;
  selectedFaculty: FetchFacultyResponse | null = null;
  searchTerm = '';
  selectedLegacyDatabase = '';
  selectedBulkPrintCollege = '';
  isPrintingFacultyId: string | null = null;
  isBulkPrinting = false;
  readonly legacyDatabaseOptions = [
    { label: 'Talisay', value: 'LEGACY_TALISAY' },
    { label: 'Alijis', value: 'LEGACY_ALIJIS' },
    { label: 'Fortune-Towne', value: 'LEGACY_FT' },
    { label: 'Binalbagan', value: 'LEGACY_BINALBAGAN' },
  ];
  readonly collegeOptions = ['CAS', 'CIT', 'COED', 'COENG', 'CCS', 'CCJ', 'COF', 'CBMA'];
  readonly statusOptions = ['ACTIVE', 'INACTIVE'];
  currentPage = 0;
  pageSize = 10;
  facultyForm: FormGroup = this.fb.group({
    facultyId: ['', [Validators.required, Validators.maxLength(30)]],
    firstname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    middlename: ['', Validators.maxLength(80)],
    lastname: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    position: ['', [Validators.required, Validators.maxLength(120)]],
    loadLimit: [0, [Validators.required, Validators.min(1), Validators.max(60)]],
    college: ['', Validators.required],
    status: ['', Validators.required],
  });
  ngOnInit(): void {
    this.loadFaculties();
    this.searchSubject
      .pipe(
        debounceTime(350),
        map((value) => this.normalizeSearchTerm(value)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.searchTerm = value;
        this.currentPage = 0;
        this.clearTransientFacultyState();
        this.loadFaculties();
      });
  }
  loadFaculties(): void {
    this.adminDataFacade.loadFaculties(
      this.currentPage,
      this.pageSize,
      this.searchTerm,
      this.selectedLegacyDatabase,
    );
  }
  onSearchChange(value: string): void {
    this.clearTransientFacultyState();

    if (value.length > 80) {
      this.searchTerm = value.slice(0, 80);
      this.toastFacade.showToast('Search is limited to 80 characters.', 'error');
      this.searchSubject.next(this.searchTerm);
      return;
    }

    this.searchSubject.next(value);
  }
  onSearch(): void {
    this.searchTerm = this.normalizeSearchTerm(this.searchTerm);
    this.currentPage = 0;
    this.clearTransientFacultyState();
    this.loadFaculties();
  }
  clearFilters(): void {
    this.searchTerm = '';
    this.selectedLegacyDatabase = '';
    this.selectedBulkPrintCollege = '';
    this.currentPage = 0;
    this.clearTransientFacultyState();
    this.loadFaculties();
  }
  onLegacyDatabaseChange(value: string): void {
    this.selectedLegacyDatabase = value;
    this.currentPage = 0;
    this.clearTransientFacultyState();
    this.loadFaculties();
  }
  onFacultyPageChange(page: number): void {
    if (page < 0) {
      return;
    }
    this.currentPage = page;
    this.clearTransientFacultyState();
    this.loadFaculties();
  }
  openEditModal(faculty: FetchFacultyResponse): void {
    this.selectedFaculty = faculty;
    this.facultyForm.patchValue({
      facultyId: faculty.facultyId,
      firstname: faculty.firstname,
      middlename: faculty.middlename,
      lastname: faculty.lastname,
      position: faculty.position,
      loadLimit: Number(faculty.loadLimit),
      college: faculty.college,
      status: faculty.status,
    });
  }
  closeEditModal(): void {
    this.clearTransientFacultyState();
  }
  updateFaculty(): void {
    if (this.facultyForm.invalid) {
      this.facultyForm.markAllAsTouched();
      this.toastFacade.showToast('Please review the highlighted faculty fields.', 'error');
      return;
    }
    this.adminDataFacade.updateFaculty(this.facultyForm.value);
    this.closeEditModal();
  }

  facultyName(faculty: FetchFacultyResponse): string {
    return repairSpecialCharacters(
      `${faculty.firstname ?? ''} ${faculty.lastname ?? ''}`.trim(),
    );
  }

  facultyInitial(faculty: FetchFacultyResponse): string {
    return repairSpecialCharacters(faculty.firstname ?? '')
      .charAt(0)
      .toLocaleUpperCase('en-PH');
  }

  legacyDatabaseLabel(legacyDatabase?: string): string {
    return (
      this.legacyDatabaseOptions.find((option) => option.value === legacyDatabase)?.label ??
      'Unassigned'
    );
  }

  hasActiveFilters(): boolean {
    return !!this.searchTerm.trim()
      || !!this.selectedLegacyDatabase
      || !!this.selectedBulkPrintCollege;
  }

  hasListFilters(): boolean {
    return !!this.searchTerm.trim() || !!this.selectedLegacyDatabase;
  }

  emptyStateTitle(): string {
    return this.hasListFilters()
      ? 'No faculty records match the current filters'
      : 'No faculty records are available';
  }

  emptyStateDescription(): string {
    return this.hasListFilters()
      ? 'Try a different search term, choose another campus, or clear the filters.'
      : 'Faculty records will appear here once they are available from the backend.';
  }

  formError(controlName: string): string {
    const control = this.facultyForm.get(controlName);

    if (!control || !(control.touched || control.dirty) || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'This field is required.';
    }

    if (control.errors['minlength']) {
      return `Enter at least ${control.errors['minlength'].requiredLength} characters.`;
    }

    if (control.errors['maxlength']) {
      return `Use ${control.errors['maxlength'].requiredLength} characters or fewer.`;
    }

    if (control.errors['min']) {
      return `Value must be at least ${control.errors['min'].min}.`;
    }

    if (control.errors['max']) {
      return `Value must not exceed ${control.errors['max'].max}.`;
    }

    return 'Please enter a valid value.';
  }

  errorMessage(error: unknown): string {
    return extractErrorMessage(error);
  }

  retryLoad(): void {
    this.clearTransientFacultyState();
    this.loadFaculties();
  }

  get f() {
    return this.facultyForm.controls;
  }
  printSingle(record: FacultyEvaluationPrintRecord): void {
    if (this.isPrintingFacultyId) {
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toastFacade.showToast(
        'The print window was blocked. Please allow pop-ups for this site and try again.',
        'error',
      );
      return;
    }

    printWindow.document.write(
      '<!doctype html><title>Preparing report...</title><body style="font-family: Arial, sans-serif; padding: 24px;">Preparing faculty evaluation report...</body>',
    );
    printWindow.document.close();

    this.setPrintingFaculty(record.facultyId);

    this.adminService.generateFacultyEvaluationReport(record.facultyId)
      .pipe(
        take(1),
        catchError((error) => {
          this.toastFacade.showToast(
            `Unable to prepare faculty report. ${extractErrorMessage(error)}`,
            'error',
          );

          printWindow.close();

          return of(null);
        }),
        finalize(() => {
          this.setPrintingFaculty(null);
        }),
      )
      .subscribe((report) => {
        if (!report) {
          return;
        }

        if (!report.items?.length) {
          this.toastFacade.showToast(
            'No evaluation records are available for this faculty.',
            'error',
          );
          printWindow.close();
          return;
        }

        const printPayload = this.toPrintPayload(report, record);

        localStorage.setItem(
          'faculty-print-data',
          JSON.stringify(printPayload),
        );

        printWindow.location.href = '/print/faculty-evaluation';
        printWindow.focus();
      });
  }

  printBulk(): void {
    if (this.isBulkPrinting) {
      return;
    }

    if (!this.selectedLegacyDatabase && !this.selectedBulkPrintCollege) {
      this.toastFacade.showToast(
        'Choose a campus, a college, or both before bulk printing.',
        'error',
      );
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.toastFacade.showToast(
        'The print window was blocked. Please allow pop-ups for this site and try again.',
        'error',
      );
      return;
    }

    printWindow.document.write(
      '<!doctype html><title>Preparing reports...</title><body style="font-family: Arial, sans-serif; padding: 24px;">Preparing faculty evaluation reports...</body>',
    );
    printWindow.document.close();

    this.setBulkPrinting(true);

    this.adminService.generateBulkFacultyEvaluationReports(
      this.selectedLegacyDatabase,
      this.selectedBulkPrintCollege,
    )
      .pipe(
        take(1),
        catchError((error) => {
          this.toastFacade.showToast(
            `Unable to prepare faculty reports. ${extractErrorMessage(error)}`,
            'error',
          );

          printWindow.close();

          return of(null);
        }),
        finalize(() => {
          this.setBulkPrinting(false);
        }),
      )
      .subscribe((response) => {
        const reports = response?.reports
          ?.map((report) => this.toPrintPayload(report))
          .filter((payload) => payload.items.length) ?? [];

        if (!reports.length) {
          this.toastFacade.showToast(
            'No printable faculty evaluation reports were found for the selected filters.',
            'error',
          );
          printWindow.close();
          return;
        }

        localStorage.setItem(
          'faculty-print-data',
          JSON.stringify({ reports }),
        );

        const skippedCount = response?.skippedFacultyIds?.length ?? 0;
        const skippedMessage = skippedCount
          ? ` ${skippedCount} faculty record(s) were skipped because no evaluated report was available.`
          : '';

        this.toastFacade.showToast(
          `Prepared ${reports.length} faculty report(s).${skippedMessage}`,
          'success',
        );

        printWindow.location.href = '/print/faculty-evaluation';
        printWindow.focus();
      });
  }

  private normalizeSearchTerm(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
  }

  private clearTransientFacultyState(): void {
    this.selectedFaculty = null;
    this.facultyForm.reset();
    this.setPrintingFaculty(null);
    this.cdr.markForCheck();
  }

  private setPrintingFaculty(facultyId: string | null): void {
    this.isPrintingFacultyId = facultyId;
    this.cdr.markForCheck();
  }

  private setBulkPrinting(isPrinting: boolean): void {
    this.isBulkPrinting = isPrinting;
    this.cdr.markForCheck();
  }

  private toPrintPayload(
    report: FacultyEvaluationGeneratedReportResponse,
    fallback: Partial<FacultyEvaluationPrintRecord> = {},
  ): {
    report: Partial<FacultyEvaluationGeneratedReportResponse>;
    items: FacultyEvaluationPrintRecord[];
  } {
    return {
      report: {
        reportId: report.reportId,
        reportHash: report.reportHash,
        verificationUrl: report.verificationUrl,
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
    fallback: Partial<FacultyEvaluationPrintRecord> = {},
  ): FacultyEvaluationPrintRecord[] {
    return items
      .filter((item) => !!item)
      .map((item) => {
        const separatedComments = this.separateEvaluationComments(item);

        return {
          facultyEvaluationScoreId: this.safePrintNumber(item.facultyEvaluationScoreId),
          facultyId: this.safePrintText(item.facultyId, fallback.facultyId),
          facultyName: this.safePrintText(item.facultyName, fallback.facultyName),
          evaluatorId: this.safePrintText(item.evaluatorId),
          evaluatorType: this.safePrintText(item.evaluatorType),
          classCode: this.safePrintText(item.classCode, fallback.classCode),
          programCode: this.safePrintText(item.programCode),
          sectionCode: this.safePrintText(item.sectionCode),
          college: this.safePrintText(item.college, fallback.college),
          position: this.safePrintText(item.position, fallback.position),
          semester: this.safePrintText(item.semester),
          schoolYear: this.safePrintNumber(item.schoolYear),
          subjectCode: this.safePrintText(item.subjectCode),
          yearLevel: this.safePrintText(item.yearLevel),
          ...separatedComments,
          overallAverageScore: this.safePrintNumber(item.overallAverageScore),
          overallInterpretation: this.safePrintText(item.overallInterpretation),
          numberOfStudents: this.safePrintNumber(item.numberOfStudents),
          setRating: this.safePrintNumber(item.setRating),
          sefRating: this.safePrintNumber(item.sefRating),
          supervisorName: this.safePrintText(item.supervisorName),
          supervisorDesignation: this.safePrintText(item.supervisorDesignation),
        };
      });
  }

  private safePrintText(value: unknown, fallback: unknown = ''): string {
    const fallbackText =
      fallback === null || fallback === undefined ? '' : String(fallback).trim();

    if (value === null || value === undefined) {
      return fallbackText;
    }

    const text = String(value).trim();

    return text && text.toLowerCase() !== 'null' && text.toLowerCase() !== 'undefined'
      ? text
      : fallbackText;
  }

  private safePrintNumber(value: unknown, fallback = 0): number {
    const number = Number(value);

    return Number.isFinite(number) ? number : fallback;
  }

  private separateEvaluationComments(
    item: EvaluationCommentSource,
  ): SeparatedEvaluationComments {
    const genericComment = this.formatPrintComment(item.comments);
    const studentComment = this.formatPrintComment(item.studentComments);
    const supervisorComment = this.formatPrintComment(item.supervisorComments);

    const evaluatorType = item.evaluatorType?.toUpperCase() ?? '';
    const isStudentEvaluation = evaluatorType.includes('STUDENT') || evaluatorType === 'SET';
    const isSupervisorEvaluation =
      evaluatorType.includes('SUPERVISOR') ||
      evaluatorType.includes('DEAN') ||
      evaluatorType.includes('PROGRAM_CHAIR') ||
      evaluatorType === 'SEF';

    return {
      commentsOrFeedbacks: genericComment,
      studentComments:
        studentComment !== '-'
          ? studentComment
          : isStudentEvaluation
            ? genericComment
            : '-',
      supervisorComments:
        supervisorComment !== '-'
          ? supervisorComment
          : isSupervisorEvaluation
            ? genericComment
            : '-',
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

    if (!normalizedComment || normalizedComment === '-') {
      return '-';
    }

    return normalizedComment;
  }
  // private openPrintWindow(data: FacultyEvaluationPrintRecord[]): void {
  //   if (!data.length) {
  //     return;
  //   }
  //   const printWindow = window.open('', '_blank', 'width=1200,height=900');
  //   if (!printWindow) {
  //     return;
  //   }
  //   const faculty = data[0];
  //   //   const setData = data.filter((item) => (item.setRating ?? 0) > 0);
  //   //   const sefData = data.filter((item) => (item.sefRating ?? 0) > 0);
  //   //   const setRows = setData
  //     .map((item, index) => {
  //       const students = item.numberOfStudents ?? 0;
  //       const setRating = item.setRating ?? 0;
  //       const weightedScore = students * setRating;
  //       return `
  //       <tr>
  //         <td>${index + 1}</td>
  //         <td>
  //           ${item.subjectCode ?? '-'}
  //         </td>
  //         <td>
  //           ${item.yearLevel ?? '-'}
  //         </td>
  //         <td>
  //           ${students}
  //         </td>
  //         <td>
  //           ${setRating.toFixed(2)}
  //         </td>
  //         <td>
  //           ${weightedScore.toFixed(2)}
  //         </td>
  //       </tr>
  //     `;
  //     })
  //     .join('');
  //   //   const sefRows = sefData
  //     .map(
  //       (item, index) => `
  //     <tr>
  //       <td>${index + 1}</td>
  //       <td>
  //         ${item.subjectCode ?? '-'}
  //       </td>
  //       <td>
  //         ${item.yearLevel ?? '-'}
  //       </td>
  //       <td>
  //         ${(item.sefRating ?? 0).toFixed(2)}
  //       </td>
  //     </tr>
  //   `,
  //     )
  //     .join('');
  //   //   const studentComments = data
  //     .filter((item) => item.studentComments && item.studentComments !== '-')
  //     .map(
  //       (item, index) => `
  //     <tr>
  //       <td>
  //         ${index + 1}
  //       </td>
  //       <td>
  //         ${item.studentComments}
  //       </td>
  //     </tr>
  //   `,
  //     )
  //     .join('');
  //   //   const supervisorComments = data
  //     .filter((item) => item.supervisorComments && item.supervisorComments !== '-')
  //     .map(
  //       (item, index) => `
  //     <tr>
  //       <td>
  //         ${index + 1}
  //       </td>
  //       <td>
  //         ${item.supervisorComments}
  //       </td>
  //     </tr>
  //   `,
  //     )
  //     .join('');
  //   //   const totalStudents = setData.reduce((total, item) => total + (item.numberOfStudents ?? 0), 0);
  //   const totalWeightedScore = setData.reduce((total, item) => {
  //     const students = item.numberOfStudents ?? 0;
  //     const setRating = item.setRating ?? 0;
  //     return total + students * setRating;
  //   }, 0);
  //   const overallSetRating = totalStudents > 0 ? totalWeightedScore / totalStudents : 0;

  //   const overallSefRating =
  //     sefData.length > 0
  //       ? sefData.reduce((total, item) => total + (item.sefRating ?? 0), 0) / sefData.length
  //       : 0;
  //   //   printWindow.document.write(`
  //   <html>
  //     <head>
  //       <title>
  //         Faculty Evaluation Report
  //       </title>
  //       <style>
  //         * {
  //           box-sizing: border-box;
  //           font-family:
  //             Arial,
  //             sans-serif;
  //         }
  //         body {
  //           margin: 0;
  //           padding: 32px;
  //           background: white;
  //           color: black;
  //         }
  //         .report-header {
  //           text-align: center;
  //           margin-bottom: 28px;
  //         }
  //         .report-header h1 {
  //           margin: 0;
  //           font-size: 24px;
  //           font-weight: 700;
  //         }
  //         .report-header p {
  //           margin-top: 6px;
  //           font-size: 14px;
  //         }
  //         .faculty-info {
  //           border: 1px solid #999;
  //           padding: 14px;
  //           margin-bottom: 26px;
  //         }
  //         .faculty-grid {
  //           display: grid;
  //           grid-template-columns:
  //             repeat(2, 1fr);
  //           gap: 12px;
  //         }
  //         table {
  //           width: 100%;
  //           border-collapse: collapse;
  //           margin-top: 14px;
  //         }
  //         th,
  //         td {
  //           border: 1px solid #999;
  //           padding: 10px;
  //           font-size: 13px;
  //           vertical-align: top;
  //         }
  //         th {
  //           background: #f3f3f3;
  //           font-weight: 700;
  //         }
  //         .section-title {
  //           margin-top: 36px;
  //           margin-bottom: 10px;
  //           font-size: 16px;
  //           font-weight: 700;
  //         }
  //         //         .approval-section {
  //           margin-top: 80px;
  //           display: flex;
  //           flex-direction: column;
  //           gap: 42px;
  //         }
  //         .approval-group {
  //           width: 100%;
  //         }
  //         .approval-heading {
  //           margin-bottom: 14px;
  //           font-size: 15px;
  //           font-weight: 500;
  //         }
  //         .approval-row {
  //           display: flex;
  //           align-items: center;
  //           margin-bottom: 14px;
  //         }
  //         .approval-label {
  //           min-width: 300px;
  //           font-size: 15px;
  //           font-weight: 600;
  //         }
  //         .approval-colon {
  //           font-size: 15px;
  //           font-weight: 600;
  //         }
  //         @page {
  //           size: A4 portrait;
  //           margin: 18mm;
  //         }
  //       </style>
  //     </head>
  //     <body>
  //       <!-- ================================================= -->
  //       <!-- HEADER -->
  //       <!-- ================================================= -->
  //       <div class="report-header">
  //         <h1>
  //           CHMSU Faculty Evaluation System
  //         </h1>
  //         <p>
  //           Individual Faculty Evaluation Report
  //         </p>
  //       </div>
  //       <!-- ================================================= -->
  //       <!-- FACULTY INFO -->
  //       <!-- ================================================= -->
  //       <div class="faculty-info">
  //         <div class="faculty-grid">
  //           <div>
  //             <strong>
  //               Name of Faculty Evaluated:
  //             </strong>
  //             ${faculty?.facultyName ?? '-'}
  //           </div>
  //           <div>
  //             <strong>
  //               Department/College:
  //             </strong>
  //             ${faculty?.college ?? '-'}
  //           </div>
  //           <div>
  //             <strong>
  //               Current Faculty Rank:
  //             </strong>
  //             ${faculty?.position ?? '-'}
  //           </div>
  //           <div>
  //             <strong>
  //               Semester/Term & Academic Year:
  //             </strong>
  //             ${faculty?.semester ? `${faculty.semester} Semester` : '-'}
  //             /
  //             ${faculty?.schoolYear ? `${faculty.schoolYear} - ${faculty.schoolYear + 1}` : '-'}
  //           </div>
  //         </div>
  //       </div>
  //       <!-- ================================================= -->
  //       <!-- SET -->
  //       <!-- ================================================= -->
  //       <div class="section-title">
  //         A. Student Evaluation of Teaching (SET)
  //       </div>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th rowspan="2">
  //               Seq
  //             </th>
  //             <th>(1)</th>
  //             <th>(2)</th>
  //             <th>(3)</th>
  //             <th>(4)</th>
  //             <th>(3 × 4)</th>
  //           </tr>
  //           <tr>
  //             <th>
  //               Course Code
  //             </th>
  //             <th>
  //               Year/Section
  //             </th>
  //             <th>
  //               No. of Students
  //             </th>
  //             <th>
  //               SET Rating
  //             </th>
  //             <th>
  //               Weighted SET Score
  //             </th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           ${setRows}
  //           <tr>
  //             <td colspan="3">
  //               <strong>
  //                 TOTAL
  //               </strong>
  //             </td>
  //             <td>
  //               <strong>
  //                 ${totalStudents}
  //               </strong>
  //             </td>
  //             <td></td>
  //             <td>
  //               <strong>
  //                 ${totalWeightedScore.toFixed(2)}
  //               </strong>
  //             </td>
  //           </tr>
  //         </tbody>
  //       </table>
  //       <!-- ================================================= -->
  //       <!-- SEF -->
  //       <!-- ================================================= -->
  //       <div class="section-title">
  //         B. Supervisor Evaluation of Faculty (SEF)
  //       </div>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th>
  //               Seq
  //             </th>
  //             <th>
  //               Course Code
  //             </th>
  //             <th>
  //               Year/Section
  //             </th>
  //             <th>
  //               SEF Rating
  //             </th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           ${sefRows}
  //         </tbody>
  //       </table>
  //       <!-- ================================================= -->
  //       <!-- OVERALL -->
  //       <!-- ================================================= -->
  //       <div class="section-title">
  //         C. Overall Evaluation Summary
  //       </div>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th>
  //               SET Rating
  //             </th>
  //             <th>
  //               SEF Rating
  //             </th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           <tr>
  //             <td>
  //               ${overallSetRating.toFixed(2)}
  //             </td>
  //             <td>
  //               ${overallSefRating.toFixed(2)}
  //             </td>
  //           </tr>
  //         </tbody>
  //       </table>
  //       <!-- ================================================= -->
  //       <!-- STUDENT COMMENTS -->
  //       <!-- ================================================= -->
  //       <div class="section-title">
  //         D. Comments and Suggestions
  //         from Students
  //       </div>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th width="80">
  //               Seq
  //             </th>
  //             <th>
  //               Student Comments
  //             </th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           ${studentComments}
  //         </tbody>
  //       </table>
  //       <!-- ================================================= -->
  //       <!-- SUPERVISOR COMMENTS -->
  //       <!-- ================================================= -->
  //       <div class="section-title">
  //         E. Comments and Suggestions
  //         from Supervisor
  //       </div>
  //       <table>
  //         <thead>
  //           <tr>
  //             <th width="80">
  //               Seq
  //             </th>
  //             <th>
  //               Supervisor Comments
  //             </th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //           ${supervisorComments}
  //         </tbody>
  //       </table>
  //       <!-- ================================================= -->
  //       <!-- APPROVALS -->
  //       <!-- ================================================= -->
  //       <div class="approval-section">
  //         <!-- PREPARED -->
  //         <div class="approval-group">
  //           <div class="approval-heading">
  //             Prepared by:
  //           </div>
  //           <div class="approval-row">
  //             <span class="approval-label">
  //               Signature of Staff
  //             </span>
  //             <span class="approval-colon">
  //               :
  //             </span>
  //           </div>
  //           <div class="approval-row">
  //             <span class="approval-label">
  //               Name of Staff
  //             </span>
  //             <span class="approval-colon">
  //               :
  //             </span>
  //           </div>
  //           <div class="approval-row">
  //             <span class="approval-label">
  //               Date
  //             </span>
  //             <span class="approval-colon">
  //               :
  //             </span>
  //           </div>
  //         </div>
  //         <!-- REVIEWED -->
  //         <div class="approval-group">
  //           <div class="approval-heading">
  //             Reviewed by:
  //           </div>
  //           <div class="approval-row">
  //             <span class="approval-label">
  //               Signature of Authorized Official
  //             </span>
  //             <span class="approval-colon">
  //               :
  //             </span>
  //           </div>
  //           <div class="approval-row">
  //             <span class="approval-label">
  //               Name of Authorized Official
  //             </span>
  //             <span class="approval-colon">
  //               :
  //             </span>
  //           </div>
  //           <div class="approval-row">
  //             <span class="approval-label">
  //               Date
  //             </span>
  //             <span class="approval-colon">
  //               :
  //             </span>
  //           </div>
  //         </div>
  //       </div>
  //     </body>
  //   </html>
  // `);
  //   printWindow.document.close();
  //   printWindow.focus();
  //   setTimeout(() => {
  //     printWindow.print();
  //   }, 500);
  // }
}
