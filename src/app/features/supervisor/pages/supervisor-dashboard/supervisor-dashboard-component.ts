import { AfterViewInit, Component, DestroyRef, OnInit, ViewChild, inject } from '@angular/core';
import { AsyncPipe, CommonModule } from '@angular/common';
import { Subject, debounceTime, distinctUntilChanged, filter, map, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SupervisorDataFacade } from '@core/store/supervisor-data/supervisor-data.facade';
import { AuthFacade } from '@core/store/auth/auth.facade';
import {
  FacultyClass,
  FacultyLoadDTO,
} from '@core/services/supervisor-data/supervisor-data-service';
import { ConfirmationModalComponent } from '@shared/components/confirmation-modal-component/confirmation-modal-component';
import { selectEvaluationStatusState } from '@core/store/supervisor-data/supervisor-data.selectors';
import { Store } from '@ngrx/store';
import { Tooltip } from 'bootstrap';
import { FormsModule } from '@angular/forms';
import { FacultyEvaluationModalComponent } from '@shared/components/faculty-evaluation-modal-component/faculty-evaluation-modal-component';
import { EvaluatedStudentsComponent } from '@shared/components/evaluated-students-component/evaluated-students-component';
import { ChangePasswordModalComponent } from "@shared/components/change-password-modal-component/change-password-modal-component";
import { AuthService, ChangePasswordRequest } from '@core/services/auth/auth-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { repairSpecialCharacters } from '@utilities/normalize-text';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { StudentEvaluationStatsComponent } from '../../components/student-evaluation-stats/student-evaluation-stats-component';

interface FacultyClassStateEntry {
  classes: FacultyClass[];
  loading: boolean;
  error: string | null;
}

type FacultyClassState = Record<string, FacultyClassStateEntry>;

const SUPERVISOR_RETURN_FACULTY_KEY = 'supervisorReturnFaculty';
const SUPERVISOR_REOPEN_FACULTY_MODAL_KEY = 'supervisorReopenFacultyModal';

interface EvaluationStatusMap {
  [key: string]: {
    classes?: Record<
      string,
      {
        evaluated: boolean | null;
        loading: boolean;
        error: string | null;
      }
    >;
  };
}

interface FacultyEvaluationProgress {
  total: number;
  evaluated: number;
  pending: number;
  percent: number;
  loading: boolean;
  error: boolean;
  complete: boolean;
  label: string;
  helper: string;
  icon: string;
  tone: 'loading' | 'empty' | 'pending' | 'partial' | 'complete' | 'error';
}

@Component({
  selector: 'app-supervisor-dashboard-component',
  standalone: true,
  imports: [
    AsyncPipe,
    CommonModule,
    ConfirmationModalComponent,
    FormsModule,
    FacultyEvaluationModalComponent,
    EvaluatedStudentsComponent,
    StudentEvaluationStatsComponent,
    UnicodeTextPipe,
    ChangePasswordModalComponent
  ],
  templateUrl: './supervisor-dashboard-component.html',
  styleUrl: './supervisor-dashboard-component.css',
})
export class SupervisorDashboardComponent implements OnInit, AfterViewInit {
  private store = inject(Store);
  private authService = inject(AuthService);
  private toastFacade = inject(ToastFacade);
  isConfirmationVisible = false;
  pendingFaculty: FacultyLoadDTO | null = null;
  evaluationStatus$ = this.store.select(selectEvaluationStatusState);
  private readonly supervisorDataFacade = inject(SupervisorDataFacade);
  private readonly authFacade = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);
  showEvaluatedStudents$ = this.supervisorDataFacade.showEvaluatedStudents$;
  showStudentEvaluationStats = false;
  backToDashboard(): void {
    this.showStudentEvaluationStats = false;
    this.supervisorDataFacade.showDashboardView();
  }
  @ViewChild('confirmationModal')
  confirmationModal!: ConfirmationModalComponent;
  readonly pageSize = 10;
  readonly status = 'ACTIVE';
  readonly program = sessionStorage.getItem('program') ?? '';
  readonly key = `${this.program}-${this.status}`;
  currentPage = 0;
  search = '';
  selectedFaculty: FacultyLoadDTO | null = null;
  selectedClass: FacultyClass | null = null;
  buildEvaluationKey(
    classCode: string,
    subjectCode: string,
    yearLevel: string,
    semester: string,
    schoolYear: number,
  ): string {
    return `${classCode}-${subjectCode}-${yearLevel}-${semester}-${schoolYear}`;
  }
  showChangePasswordModal = false;
  isChangingPassword = false;
  private readonly searchSubject = new Subject<string>();
  readonly evaluatorId$ = this.authFacade.evaluatorId$;
  readonly faculties$ = this.supervisorDataFacade.faculties$(this.key);
  readonly loading$ = this.supervisorDataFacade.facultiesLoading$(this.key);
  readonly error$ = this.supervisorDataFacade.facultiesError$(this.key);
  readonly pagination$ = this.supervisorDataFacade.facultyPagination$(this.key);
  readonly facultyClasses$ = this.supervisorDataFacade.facultyClasses$(this.key);
  readonly totalFaculty$ = this.pagination$.pipe(map((pagination) => pagination.totalElements));
  readonly totalPages$ = this.pagination$.pipe(map((pagination) => pagination.totalPages));
  ngOnInit(): void {
    const requiresPasswordChange =
      sessionStorage.getItem('requiresPasswordChange') === 'true';
    this.showChangePasswordModal = requiresPasswordChange;
    this.initializeSearch();
    this.initializeFacultyLoad();
    this.initializeFacultyEvaluationOverview();
    this.restoreFacultyModalAfterEvaluation();
  }
  ngAfterViewInit(): void {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach((tooltipTriggerEl) => {
      new Tooltip(tooltipTriggerEl);
    });
  }
  private initializeFacultyLoad(): void {
    this.evaluatorId$
      .pipe(filter(Boolean), take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((userId) => {
        this.loadFaculties(Number(userId));
      });
  }
  private initializeSearch(): void {
    this.searchSubject
      .pipe(
        map((value) => value.trim()),
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((search) => {
        this.search = search.toLowerCase();
        this.currentPage = 0;
        this.clearSelectedFacultyContext();
        this.reload();
      });
  }
  private initializeFacultyEvaluationOverview(): void {
    this.faculties$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((faculties) => {
        faculties.forEach((faculty) => {
          this.supervisorDataFacade.loadFacultyClasses(
            this.key,
            faculty.facultyId,
            this.program,
          );
        });
      });
  }
  private restoreFacultyModalAfterEvaluation(): void {
    const shouldRestore =
      sessionStorage.getItem(SUPERVISOR_REOPEN_FACULTY_MODAL_KEY) === 'true';
    const facultyJson = sessionStorage.getItem(SUPERVISOR_RETURN_FACULTY_KEY);

    if (!shouldRestore || !facultyJson) {
      return;
    }

    sessionStorage.removeItem(SUPERVISOR_REOPEN_FACULTY_MODAL_KEY);
    sessionStorage.removeItem(SUPERVISOR_RETURN_FACULTY_KEY);

    try {
      const faculty = JSON.parse(facultyJson) as FacultyLoadDTO;

      if (!faculty?.facultyId) {
        return;
      }

      this.supervisorDataFacade.showDashboardView();
      this.showStudentEvaluationStats = false;
      this.selectedFaculty = faculty;
      this.selectedClass = null;
      this.pendingFaculty = null;
      this.isConfirmationVisible = false;
      this.supervisorDataFacade.loadFacultyClasses(
        this.key,
        faculty.facultyId,
        this.program,
      );
    } catch {
      sessionStorage.removeItem(SUPERVISOR_REOPEN_FACULTY_MODAL_KEY);
      sessionStorage.removeItem(SUPERVISOR_RETURN_FACULTY_KEY);
    }
  }
  onSearch(event: Event): void {
    const value = (event.target as HTMLInputElement)?.value ?? '';
    this.searchSubject.next(value);
  }
  private loadFaculties(userId: number): void {
    this.supervisorDataFacade.loadFaculties(
      this.key,
      this.program,
      userId,
      this.currentPage,
      this.pageSize,
      'lastname,asc',
      this.search,
    );
  }
  reload(): void {
    this.evaluatorId$.pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe((userId) => {
      if (!userId) {
        return;
      }
      this.loadFaculties(Number(userId));
    });
  }
  nextPage(totalPages: number): void {
    if (this.currentPage + 1 >= totalPages) {
      return;
    }
    this.currentPage++;
    this.clearSelectedFacultyContext();
    this.reload();
  }
  previousPage(): void {
    if (this.currentPage <= 0) {
      return;
    }
    this.currentPage--;
    this.clearSelectedFacultyContext();
    this.reload();
  }
  goToPage(page: number): void {
    if (page === this.currentPage) {
      return;
    }
    this.currentPage = page;
    this.clearSelectedFacultyContext();
    this.reload();
  }
  getPageNumbers(totalPages: number): number[] {
    const maxVisiblePages = 5;
    let start = Math.max(0, this.currentPage - Math.floor(maxVisiblePages / 2));
    let end = start + maxVisiblePages;
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(0, end - maxVisiblePages);
    }
    return Array.from({ length: end - start }, (_, i) => start + i);
  }
  openFaculty(faculty: FacultyLoadDTO): void {
    this.selectedFaculty = faculty;
    this.supervisorDataFacade.loadFacultyClasses(this.key, faculty.facultyId, this.program);
  }
  closeFacultyModal(): void {
    this.selectedFaculty = null;
    this.selectedClass = null;
    this.pendingFaculty = null;
    this.isConfirmationVisible = false;
  }
  openFacultyConfirmation(faculty: FacultyLoadDTO): void {
    this.pendingFaculty = faculty;
    this.isConfirmationVisible = true;
  }
  confirmFacultyEvaluation(): void {
    if (!this.pendingFaculty) {
      return;
    }
    this.isConfirmationVisible = false;
    this.openFaculty(this.pendingFaculty);
  }
  closeFacultyConfirmation(): void {
    this.isConfirmationVisible = false;
    this.pendingFaculty = null;
  }
  private clearSelectedFacultyContext(): void {
    this.selectedFaculty = null;
    this.selectedClass = null;
    this.pendingFaculty = null;
    this.isConfirmationVisible = false;
    this.supervisorDataFacade.clearFacultySelectionContext(this.key);
  }
  confirmEvaluation(): void {
    this.isConfirmationVisible = false;
    if (!this.selectedClass || !this.selectedFaculty) {
      return;
    }
    this.startEvaluation(this.selectedClass, this.selectedFaculty);
  }
  startEvaluation(cls: FacultyClass, faculty: FacultyLoadDTO): void {
    const facultyName = repairSpecialCharacters(
      `${faculty.firstname ?? ''} ${faculty.lastname ?? ''}`.trim(),
    );

    sessionStorage.setItem(
      SUPERVISOR_RETURN_FACULTY_KEY,
      JSON.stringify(faculty),
    );

    this.supervisorDataFacade.selectClass({
      ...cls,
      college: faculty.college,
      facultyId: faculty.facultyId,
      facultyName,
    });
  }
  getCampusName(campus: string): string {
    const campusMap: Record<string, string> = {
      LEGACY_FT: 'Fortune Towne Campus',
      LEGACY_ALIJIS: 'Alijis Campus',
      LEGACY_BINALBAGAN: 'Binalbagan Campus',
      LEGACY_TALISAY: 'Talisay Campus',
    };
    return campusMap[campus] || campus;
  }
  getFacultyInitials(faculty: FacultyLoadDTO): string {
    const first = repairSpecialCharacters(faculty.firstname ?? '').charAt(0);
    const last = repairSpecialCharacters(faculty.lastname ?? '').charAt(0);
    return `${first}${last}`;
  }
  schoolYear(): number {
    return new Date().getFullYear();
  }
  semester(): string {
    return '2nd';
  }
  trackFaculty(_: number, faculty: FacultyLoadDTO): string {
    return faculty.facultyId;
  }
  trackClass(_: number, cls: FacultyClass): string {
    return cls.classCode;
  }
  getFacultyEvaluationProgress(
    faculty: FacultyLoadDTO,
    facultyClassesState: FacultyClassState | null | undefined,
    evaluationStatus: EvaluationStatusMap | null | undefined,
  ): FacultyEvaluationProgress {
    const entry = facultyClassesState?.[faculty.facultyId];

    if (!entry) {
      return this.createFacultyEvaluationProgress({
        loading: true,
        label: 'Loading subjects',
        helper: 'Checking assigned subjects',
        icon: 'bi-arrow-repeat',
        tone: 'loading',
      });
    }

    if (entry.loading) {
      return this.createFacultyEvaluationProgress({
        loading: true,
        label: 'Loading subjects',
        helper: 'Checking assigned subjects',
        icon: 'bi-arrow-repeat',
        tone: 'loading',
      });
    }

    if (entry.error) {
      return this.createFacultyEvaluationProgress({
        error: true,
        label: 'Unable to load',
        helper: 'Refresh or open the faculty again',
        icon: 'bi-exclamation-triangle-fill',
        tone: 'error',
      });
    }

    const classes = entry.classes ?? [];

    if (!classes.length) {
      return this.createFacultyEvaluationProgress({
        label: 'No subjects',
        helper: 'No assigned subjects found',
        icon: 'bi-journal-x',
        tone: 'empty',
      });
    }

    const statusGroup = evaluationStatus?.[this.key]?.classes ?? {};
    const evaluated = classes.filter((cls) => {
      const evaluationKey = this.buildEvaluationKey(
        cls.classCode,
        cls.subjectCode,
        cls.yearLevel,
        cls.semester,
        cls.schoolYear,
      );

      return statusGroup[evaluationKey]?.evaluated === true;
    }).length;
    const hasPendingStatus = classes.some((cls) => {
      const evaluationKey = this.buildEvaluationKey(
        cls.classCode,
        cls.subjectCode,
        cls.yearLevel,
        cls.semester,
        cls.schoolYear,
      );
      const status = statusGroup[evaluationKey];

      return !status || status.loading || status.evaluated === null;
    });
    const pending = Math.max(classes.length - evaluated, 0);
    const complete = evaluated === classes.length && !hasPendingStatus;
    const percent = Math.round((evaluated / classes.length) * 100);

    if (hasPendingStatus) {
      return this.createFacultyEvaluationProgress({
        total: classes.length,
        evaluated,
        pending,
        percent,
        loading: true,
        label: `${evaluated} of ${classes.length} checked`,
        helper: 'Updating status',
        icon: 'bi-arrow-repeat',
        tone: evaluated > 0 ? 'partial' : 'loading',
      });
    }

    if (complete) {
      return this.createFacultyEvaluationProgress({
        total: classes.length,
        evaluated,
        pending,
        percent: 100,
        complete: true,
        label: 'Completed',
        helper: `${classes.length} subject${classes.length === 1 ? '' : 's'} evaluated`,
        icon: 'bi-check-circle-fill',
        tone: 'complete',
      });
    }

    return this.createFacultyEvaluationProgress({
      total: classes.length,
      evaluated,
      pending,
      percent,
      label: `${evaluated} of ${classes.length} evaluated`,
      helper: `${pending} subject${pending === 1 ? '' : 's'} remaining`,
      icon: evaluated > 0 ? 'bi-hourglass-split' : 'bi-clock-history',
      tone: evaluated > 0 ? 'partial' : 'pending',
    });
  }
  private createFacultyEvaluationProgress(
    progress: Partial<FacultyEvaluationProgress>,
  ): FacultyEvaluationProgress {
    return {
      total: progress.total ?? 0,
      evaluated: progress.evaluated ?? 0,
      pending: progress.pending ?? 0,
      percent: progress.percent ?? 0,
      loading: progress.loading ?? false,
      error: progress.error ?? false,
      complete: progress.complete ?? false,
      label: progress.label ?? 'Pending',
      helper: progress.helper ?? '',
      icon: progress.icon ?? 'bi-clock-history',
      tone: progress.tone ?? 'pending',
    };
  }
  logout(): void {
    this.authFacade.logout();
  }
  openEvaluatedStudents(): void {
    this.supervisorDataFacade.showEvaluatedStudentsView();
  }
  toggleEvaluatedStudents(): void {
    if (this.showStudentEvaluationStats) {
      this.showStudentEvaluationStats = false;
      this.supervisorDataFacade.showEvaluatedStudentsView();
      return;
    }

    this.showEvaluatedStudents$.pipe(take(1)).subscribe((show) => {
      if (show) {
        this.supervisorDataFacade.showDashboardView();
      } else {
        this.supervisorDataFacade.showEvaluatedStudentsView();
      }
    });
  }

  toggleStudentEvaluationStats(): void {
    this.showEvaluatedStudents$.pipe(take(1)).subscribe((showCompletedEvaluations) => {
      if (!this.showStudentEvaluationStats) {
        this.supervisorDataFacade.showDashboardView();
      }

      this.showStudentEvaluationStats = !this.showStudentEvaluationStats;

      if (!this.showStudentEvaluationStats && showCompletedEvaluations) {
        this.supervisorDataFacade.showDashboardView();
      }
    });
  }
  onChangePasswordModalClose(): void {

    const requiresPasswordChange =
      sessionStorage.getItem(
        'requiresPasswordChange'
      ) === 'true';

    if (requiresPasswordChange) {

      this.toastFacade.showToast(
        'You must change your password before continuing.',
        'error'
      );

      return;

    }

    this.showChangePasswordModal = false;

  }
  changePassword(
    request: ChangePasswordRequest
  ): void {

    this.isChangingPassword = true;

    this.authService
      .changePassword(request)
      .subscribe({

        next: (response) => {

          this.isChangingPassword = false;

          sessionStorage.removeItem(
            'requiresPasswordChange'
          );

          this.toastFacade.showToast(
            response,
            'success'
          );

          this.showChangePasswordModal = false;

        },

        error: (error: any) => {

          this.isChangingPassword = false;

          this.toastFacade.showToast(
            error?.error?.message ??
            'Failed to change password.',
            'error'
          );

        }

      });

  }

}
