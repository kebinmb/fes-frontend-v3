import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import {
  AdminService,
  FacultyLoadStatus,
  FacultyWorkloadClassOptionResponse,
  FacultyWorkloadRequest,
  FacultyWorkloadResponse,
  FacultyWorkloadSource,
  FetchFacultyResponse,
  Semester,
} from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';

interface AssignmentWorkloadDraft {
  key: string;
  option: FacultyWorkloadClassOptionResponse;
  facultyWorkloadId: number | null;
  totalHoursPerWeek: number | null;
  loadStatus: FacultyLoadStatus;
  savedTotalHoursPerWeek: number | null;
  savedLoadStatus: FacultyLoadStatus | null;
  isEncoded: boolean;
  isSaving: boolean;
}

@Component({
  selector: 'app-faculty-workload-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    UnicodeTextPipe,
  ],
  templateUrl: './faculty-workload-component.html',
  styleUrl: './faculty-workload-component.css',
})
export class FacultyWorkloadComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy$ = new Subject<void>();
  private readonly facultySearch$ = new Subject<string>();
  private readonly workloadSearch$ = new Subject<string>();
  private facultySearchRequestId = 0;
  private classOptionsRequestId = 0;
  private workloadRequestId = 0;
  private selectedFacultyTermWorkloadRequestId = 0;
  private recalculationTimer: ReturnType<typeof setTimeout> | null = null;
  private currentClassOptionsKey = '';
  private readonly classOptionsCache = new Map<
    string,
    FacultyWorkloadClassOptionResponse[]
  >();
  private readonly standardPreparationLoadLimit = 21;
  private readonly highPreparationLoadLimit = 18;
  private readonly highPreparationThreshold = 3;
  private viewRefreshPending = false;
  private viewRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private isDestroyed = false;

  readonly semesterOptions: Array<{ label: string; value: Semester }> = [
    { label: 'First Semester', value: 'FIRST_SEMESTER' },
    { label: 'Second Semester', value: 'SECOND_SEMESTER' },
    { label: 'Summer Semester', value: 'SUMMER_SEMESTER' },
  ];
  readonly sourceOptions = ['MANUAL', 'IMPORTED', 'SYSTEM'] as const;

  facultyResults: FetchFacultyResponse[] = [];
  workloads: FacultyWorkloadResponse[] = [];
  selectedFacultyTermWorkloads: FacultyWorkloadResponse[] = [];
  classOptions: FacultyWorkloadClassOptionResponse[] = [];
  assignmentDrafts: AssignmentWorkloadDraft[] = [];
  selectedFaculty: FetchFacultyResponse | null = null;
  selectedClassKey = '';
  facultySearchTerm = '';
  workloadSearchTerm = '';
  assignmentDraftSearchTerm = '';
  page = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  isLoadingFaculties = false;
  isLoadingWorkloads = false;
  isLoadingClasses = false;
  isSaving = false;
  deletingWorkloadId: number | null = null;
  workloadPendingDelete: FacultyWorkloadResponse | null = null;
  selectedFacultyWorkloadCount = 0;
  projectedTeachingLoadValue = 0;
  projectedTotalWorkloadValue = 0;
  projectedOverloadHoursValue = 0;
  visibleHoursPerWeekTotalValue = 0;
  showFacultySearchResults = false;
  isEncodedHistoryOpen = false;

  workloadForm = this.fb.group({
    facultyWorkloadId: [null as number | null],
    facultyId: ['', Validators.required],
    schoolYear: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    semester: ['FIRST_SEMESTER' as Semester, Validators.required],
    classCode: [''],
    courseCode: ['', Validators.required],
    programCode: ['', Validators.required],
    yearLevel: ['', Validators.required],
    sectionCode: ['', Validators.required],
    totalHoursPerWeek: [0, [Validators.required, Validators.min(0)]],
    totalTeachingLoad: [0, [Validators.required, Validators.min(0)]],
    numberOfPreparations: [0, [Validators.required, Validators.min(0)]],
    designationEtu: [0, [Validators.required, Validators.min(0)]],
    totalWorkload: [0, [Validators.required, Validators.min(0)]],
    overloadHours: [0, [Validators.required, Validators.min(0)]],
    loadStatus: ['Regular' as FacultyLoadStatus, Validators.required],
    source: ['MANUAL' as FacultyWorkloadSource, Validators.required],
    remarks: [''],
  });

  ngOnInit(): void {
    this.initializeCurrentTerm();
    this.initializeSearch();
    this.initializeFacultyIdLookup();
    this.initializeWorkloadCalculation();
    this.initializeRouteFacultyFocus();
    this.searchFaculties('');
    this.loadWorkloads();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;

    if (this.recalculationTimer) {
      clearTimeout(this.recalculationTimer);
    }

    if (this.viewRefreshTimer) {
      clearTimeout(this.viewRefreshTimer);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  onFacultySearchChange(value: string): void {
    this.facultySearch$.next(value);
  }

  onWorkloadSearchChange(value: string): void {
    this.workloadSearch$.next(value);
  }

  refreshWorkloads(): void {
    this.page = 0;
    this.loadWorkloads();
  }

  toggleEncodedHistory(): void {
    this.isEncodedHistoryOpen = !this.isEncodedHistoryOpen;
  }

  refreshTeachingAssignments(): void {
    this.invalidateCurrentClassOptionsCache();
    this.loadClassOptions();
    this.loadSelectedFacultyTermWorkloads();
    this.loadWorkloads();
  }

  selectFaculty(faculty: FetchFacultyResponse): void {
    this.applySelectedFaculty(faculty);
  }

  editWorkload(workload: FacultyWorkloadResponse): void {
    if (!workload.facultyWorkloadId) {
      this.applyWorkloadForEditing(workload);
      return;
    }

    this.isLoadingWorkloads = true;
    this.adminService
      .getFacultyWorkloadById(workload.facultyWorkloadId)
      .pipe(
        finalize(() => {
          this.isLoadingWorkloads = false;
          this.updateDashboardState();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.applyWorkloadForEditing(response);
        },
        error: (error) => {
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  confirmDeleteWorkload(workload: FacultyWorkloadResponse): void {
    this.workloadPendingDelete = workload;
    this.requestViewRefresh();
  }

  cancelDeleteWorkload(): void {
    if (this.deletingWorkloadId !== null) {
      return;
    }

    this.workloadPendingDelete = null;
    this.requestViewRefresh();
  }

  deleteWorkload(): void {
    const workload = this.workloadPendingDelete;

    if (!workload?.facultyWorkloadId || this.deletingWorkloadId !== null) {
      return;
    }

    this.deletingWorkloadId = workload.facultyWorkloadId;
    this.updateDashboardState();
    this.adminService
      .deleteFacultyWorkload(workload.facultyWorkloadId)
      .pipe(
        finalize(() => {
          this.deletingWorkloadId = null;
          this.updateDashboardState();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: () => {
          this.removeDeletedWorkloadFromLocalState(workload);
          this.selectedFacultyTermWorkloads = this.selectedFacultyTermWorkloads.filter(
            (item) => item.facultyWorkloadId !== workload.facultyWorkloadId,
          );
          this.clearDeletedWorkloadFromForm(workload);
          this.invalidateCurrentClassOptionsCache();
          this.workloadPendingDelete = null;
          this.toastFacade.showToast('Faculty workload deleted successfully.', 'success');
          this.loadClassOptions();
          this.loadWorkloads();
        },
        error: (error) => {
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private applyWorkloadForEditing(workload: FacultyWorkloadResponse): void {
    this.selectedFaculty = {
      facultyId: workload.facultyId,
      firstname: workload.facultyName ?? workload.facultyId,
      lastname: '',
      middlename: '',
      position: '',
      loadLimit: String(workload.loadLimit ?? ''),
      status: '',
      college: workload.college ?? '',
    };
    this.facultySearchTerm = this.facultySearchLabel(this.selectedFaculty);
    this.workloadSearchTerm = workload.facultyId;
    this.patchWorkload(workload);
    this.loadSelectedFacultyTermWorkloads();
  }

  clearForm(): void {
    const schoolYear = this.workloadForm.controls.schoolYear.value ?? new Date().getFullYear();
    const semester = this.workloadForm.controls.semester.value ?? 'FIRST_SEMESTER';

    this.selectedFaculty = null;
    this.selectedFacultyTermWorkloads = [];
    this.workloadSearchTerm = '';
    this.workloadForm.reset({
      facultyId: '',
      facultyWorkloadId: null,
      schoolYear,
      semester,
      classCode: '',
      courseCode: '',
      programCode: '',
      yearLevel: '',
      sectionCode: '',
      totalHoursPerWeek: 0,
      totalTeachingLoad: 0,
      numberOfPreparations: 0,
      designationEtu: 0,
      totalWorkload: 0,
      overloadHours: 0,
      loadStatus: 'Regular',
      source: 'MANUAL',
      remarks: '',
    });
    this.selectedClassKey = '';
    this.classOptions = [];
    this.assignmentDrafts = [];
    this.assignmentDraftSearchTerm = '';
    this.searchFaculties('');
    this.loadWorkloads();
    this.updateDashboardState(0, 0, 0);
  }

  previousPage(): void {
    if (this.page === 0) {
      return;
    }

    this.page -= 1;
    this.loadWorkloads();
  }

  nextPage(): void {
    if (this.page >= this.totalPages - 1) {
      return;
    }

    this.page += 1;
    this.loadWorkloads();
  }

  statusLabel(status: FacultyLoadStatus | string | null | undefined): string {
    return this.normalizeLoadStatus(status);
  }

  saveAssignmentDraft(draft: AssignmentWorkloadDraft): void {
    if (!this.selectedFaculty) {
      this.toastFacade.showToast('Select a faculty before saving an assignment.', 'error');
      return;
    }

    if (!this.isAssignmentDraftValid(draft)) {
      this.toastFacade.showToast('Enter valid subject hours before saving.', 'error');
      return;
    }

    const totals = this.assignmentDraftTotals(draft);

    draft.isSaving = true;
    this.updateDashboardState();
    this.adminService
      .upsertFacultyWorkload(this.buildAssignmentDraftPayload(draft, totals))
      .pipe(
        finalize(() => {
          draft.isSaving = false;
          this.updateDashboardState();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          draft.isSaving = false;
          this.workloadSearchTerm = response.facultyId;
          this.page = 0;
          this.mergeSavedWorkload(response);
          this.mergeSelectedFacultyTermWorkload(response);
          this.applyCommonFieldsToLocalTerm(response);
          this.syncSelectedFacultyFromWorkload(response);
          this.patchAssignmentDraftFromWorkload(response);
          this.rebuildAssignmentDrafts();
          this.toastFacade.showToast('Teaching assignment workload saved.', 'success');
          this.loadWorkloads();
        },
        error: (error) => {
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  isAssignmentDraftValid(draft: AssignmentWorkloadDraft): boolean {
    return this.toNumber(draft.totalHoursPerWeek) > 0;
  }

  assignmentDraftStatus(draft: AssignmentWorkloadDraft): FacultyLoadStatus {
    return this.normalizeLoadStatus(draft.loadStatus);
  }

  isAssignmentDraftDirty(draft: AssignmentWorkloadDraft): boolean {
    if (!draft.isEncoded) {
      return this.toNumber(draft.totalHoursPerWeek) > 0 ||
        this.assignmentDraftStatus(draft) === 'Overload';
    }

    return this.toNumber(draft.totalHoursPerWeek) !==
        this.toNumber(draft.savedTotalHoursPerWeek) ||
      this.assignmentDraftStatus(draft) !==
        this.normalizeLoadStatus(draft.savedLoadStatus);
  }

  assignmentDraftDataHint(draft: AssignmentWorkloadDraft): string {
    if (draft.isSaving) {
      return 'Saving this row...';
    }

    if (draft.isEncoded && this.isAssignmentDraftDirty(draft)) {
      return 'Existing data loaded; current changes are not saved yet.';
    }

    if (draft.isEncoded) {
      return `Existing data: ${this.toNumber(draft.savedTotalHoursPerWeek)} hrs/week, ${this.normalizeLoadStatus(draft.savedLoadStatus)}.`;
    }

    if (this.isAssignmentDraftDirty(draft)) {
      return 'New row data entered; save this row to encode it.';
    }

    return 'No encoded data yet.';
  }

  semesterLabel(semester: string | null | undefined): string {
    const normalizedSemester = this.normalizeSemester(semester);

    return (
      this.semesterOptions.find((option) => option.value === normalizedSemester)?.label ??
      semester ??
      '-'
    );
  }

  facultyName(faculty: FetchFacultyResponse): string {
    return `${faculty.firstname ?? ''} ${faculty.lastname ?? ''}`.trim() || faculty.facultyId;
  }

  facultySearchLabel(faculty: FetchFacultyResponse): string {
    const name = this.facultyName(faculty);

    return name === faculty.facultyId ? faculty.facultyId : `${name} (${faculty.facultyId})`;
  }

  isSelectedFaculty(faculty: FetchFacultyResponse): boolean {
    return this.selectedFaculty?.facultyId === faculty.facultyId;
  }

  classOptionLabel(option: FacultyWorkloadClassOptionResponse): string {
    return `${option.classCode} - ${option.courseCode} / ${option.programCode} / ${option.yearLevel} / ${option.sectionCode}`;
  }

  get availableClassOptions(): FacultyWorkloadClassOptionResponse[] {
    const options = this.classOptions.filter(
      (option) => !this.isClassOptionAlreadyEncoded(option),
    );
    const selectedOption = this.selectedClassOptionFromForm();

    if (
      selectedOption &&
      !options.some(
        (option) =>
          this.classOptionKey(option) === this.classOptionKey(selectedOption),
      )
    ) {
      return [selectedOption, ...options];
    }

    return options;
  }

  get classOptionPlaceholder(): string {
    if (!this.selectedFaculty) {
      return 'Select a faculty first';
    }

    if (this.isLoadingClasses) {
      return 'Loading classes...';
    }

    return this.availableClassOptions.length === 0
      ? 'All teaching assignments are already encoded'
      : 'Select an available class';
  }

  get selectedFacultyWorkloads(): FacultyWorkloadResponse[] {
    const facultyId = this.workloadForm.controls.facultyId.value;

    if (!facultyId) {
      return [];
    }

    return this.workloads.filter((workload) => workload.facultyId === facultyId);
  }

  get projectedTeachingLoad(): number {
    return this.toNumber(this.workloadForm.controls.totalTeachingLoad.value);
  }

  get projectedTotalWorkload(): number {
    return this.toNumber(this.workloadForm.controls.totalWorkload.value);
  }

  get projectedOverloadHours(): number {
    return this.toNumber(this.workloadForm.controls.overloadHours.value);
  }

  get visibleHoursPerWeekTotal(): number {
    return this.workloads.reduce(
      (total, workload) => total + this.toNumber(workload.totalHoursPerWeek),
      0,
    );
  }

  get selectedFacultyInitials(): string {
    if (!this.selectedFaculty) {
      return '--';
    }

    const parts = this.facultyName(this.selectedFaculty)
      .split(/\s+/)
      .filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

    return `${first}${last}`.toUpperCase() || '--';
  }

  get selectedFacultyMeta(): string {
    if (!this.selectedFaculty) {
      return 'Search and select a faculty to begin encoding.';
    }

    return [
      `#${this.selectedFaculty.facultyId}`,
      this.selectedFaculty.college || 'No college',
    ].join(' - ');
  }

  get selectedFacultyLoadLimit(): string {
    return String(this.effectiveLoadLimit());
  }

  get filteredAssignmentDrafts(): AssignmentWorkloadDraft[] {
    const term = this.assignmentDraftSearchTerm.trim().toLowerCase();

    if (!term) {
      return this.assignmentDrafts;
    }

    return this.assignmentDrafts.filter((draft) => {
      const option = draft.option;

      return [
        option.classCode,
        option.courseCode,
        option.programCode,
        option.yearLevel,
        option.sectionCode,
        draft.isEncoded ? 'encoded' : 'pending',
      ]
        .join(' ')
        .toLowerCase()
        .includes(term);
    });
  }

  get encodedAssignmentDraftCount(): number {
    return this.assignmentDrafts.filter((draft) => draft.isEncoded).length;
  }

  onClassOptionChange(classKey: string): void {
    this.selectedClassKey = classKey;
    const option = this.availableClassOptions.find(
      (item) => this.classOptionKey(item) === classKey,
    );

    if (!option) {
      this.workloadForm.patchValue({
        classCode: '',
        courseCode: '',
        programCode: '',
        yearLevel: '',
        sectionCode: '',
      });
      this.recalculateWorkload();
      return;
    }

    this.workloadForm.patchValue({
      classCode: option.classCode,
      courseCode: option.courseCode,
      programCode: option.programCode,
      yearLevel: option.yearLevel,
      sectionCode: option.sectionCode,
    });
    this.recalculateWorkload();
  }

  private initializeCurrentTerm(): void {
    this.adminService
      .fetchCurrentSchoolYearAndSemester()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (term) => {
          this.workloadForm.patchValue({
            schoolYear: term.schoolYear,
            semester: this.normalizeSemester(term.semester),
          });
          this.loadClassOptions();
          this.loadWorkloads();
        },
        error: (error) => {
          if (this.isSessionExpiredError(error)) {
            return;
          }

          this.toastFacade.showToast(
            'Using the current year because no active term was loaded.',
            'error',
          );
        },
      });
  }

  private initializeSearch(): void {
    this.facultySearch$
      .pipe(
        debounceTime(250),
        distinctUntilChanged(),
        switchMap((value) => {
          const requestId = ++this.facultySearchRequestId;
          this.isLoadingFaculties = true;
          this.updateFacultySearchVisibility();

          return this.adminService.getFaculties(0, 10, value.trim()).pipe(
            catchError((error) => {
              this.toastFacade.showToast(extractErrorMessage(error), 'error');
              return of({ content: [] as FetchFacultyResponse[] });
            }),
            finalize(() => {
              if (requestId === this.facultySearchRequestId) {
                this.isLoadingFaculties = false;
                this.updateFacultySearchVisibility();
              }
            }),
          );
        }),
        takeUntil(this.destroy$),
      )
      .subscribe((response) => {
        this.facultyResults = response.content ?? [];
        this.updateFacultySearchVisibility();
      });

    this.workloadSearch$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.workloadSearchTerm = value;
        this.page = 0;
        this.loadWorkloads();
      });
  }

  private isSessionExpiredError(error: unknown): boolean {
    return error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403);
  }

  private initializeFacultyIdLookup(): void {
    this.workloadForm.controls.facultyId.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.resolveFacultyFromInput(value ?? '');
      });
  }

  private initializeWorkloadCalculation(): void {
    this.workloadForm.controls.totalHoursPerWeek.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.scheduleRecalculateWorkload());

    this.workloadForm.controls.designationEtu.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.scheduleRecalculateWorkload());

    this.workloadForm.controls.numberOfPreparations.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.scheduleRecalculateWorkload());

    this.workloadForm.controls.schoolYear.valueChanges
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => this.refreshTermWorkloads());

    this.workloadForm.controls.semester.valueChanges
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => this.refreshTermWorkloads());
  }

  private initializeRouteFacultyFocus(): void {
    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const facultyId = params.get('facultyId')?.trim();

        if (!facultyId) {
          return;
        }

        this.facultySearchTerm = facultyId;
        this.workloadSearchTerm = facultyId;
        this.workloadForm.patchValue({ facultyId });
        this.page = 0;
        this.loadWorkloads();
      });
  }

  private searchFaculties(search: string): void {
    this.updateFacultySearchVisibility();
    this.facultySearch$.next(search);
  }

  private loadWorkloads(): void {
    const requestId = ++this.workloadRequestId;

    this.isLoadingWorkloads = true;
    this.updateDashboardState();
    this.adminService
      .getFacultyWorkloads(
        this.page,
        this.pageSize,
        this.workloadSearchTerm,
        this.workloadForm.controls.schoolYear.value,
        this.workloadForm.controls.semester.value ?? '',
      )
      .pipe(
        finalize(() => {
          if (requestId === this.workloadRequestId) {
            this.isLoadingWorkloads = false;
            this.updateDashboardState();
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          if (requestId !== this.workloadRequestId) {
            return;
          }

          this.workloads = response.content ?? [];
          this.totalElements = response.totalElements ?? 0;
          this.totalPages = Math.max(response.totalPages ?? 1, 1);
          this.syncCommonTermFieldsFromWorkloads();
          this.recalculateWorkload();
          this.rebuildAssignmentDrafts();
          this.requestViewRefresh();
        },
        error: (error) => {
          if (requestId !== this.workloadRequestId) {
            return;
          }

          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private loadSelectedFacultyTermWorkloads(): void {
    const facultyId = this.workloadForm.controls.facultyId.value?.trim() ?? '';
    const schoolYear = this.workloadForm.controls.schoolYear.value;
    const semester = this.workloadForm.controls.semester.value?.trim() ?? '';

    if (!facultyId || !schoolYear || !semester) {
      this.selectedFacultyTermWorkloadRequestId += 1;
      this.selectedFacultyTermWorkloads = [];
      this.rebuildAssignmentDrafts();
      return;
    }

    const requestId = ++this.selectedFacultyTermWorkloadRequestId;

    this.adminService
      .getFacultyWorkloads(0, 500, facultyId, schoolYear, semester)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (requestId !== this.selectedFacultyTermWorkloadRequestId) {
            return;
          }

          this.selectedFacultyTermWorkloads = response.content ?? [];
          this.syncCommonTermFieldsFromWorkloads();
          this.recalculateWorkload();
          this.rebuildAssignmentDrafts();
          this.requestViewRefresh();
        },
        error: (error) => {
          if (requestId !== this.selectedFacultyTermWorkloadRequestId) {
            return;
          }

          this.selectedFacultyTermWorkloads = [];
          this.rebuildAssignmentDrafts();
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private refreshTermWorkloads(): void {
    this.page = 0;
    this.clearClassSelection();
    this.loadClassOptions();
    this.loadSelectedFacultyTermWorkloads();
    this.loadWorkloads();

  }

  private loadClassOptions(): void {
    const facultyId = this.workloadForm.controls.facultyId.value?.trim() ?? '';
    const schoolYear = this.workloadForm.controls.schoolYear.value;
    const semester = this.workloadForm.controls.semester.value?.trim() ?? '';

    if (!facultyId || !schoolYear || !semester) {
      this.classOptionsRequestId += 1;
      this.currentClassOptionsKey = '';
      this.classOptions = [];
      this.assignmentDrafts = [];
      this.selectedClassKey = '';
      this.isLoadingClasses = false;
      this.updateDashboardState();
      return;
    }

    const cacheKey = this.classOptionsCacheKey(facultyId, schoolYear, semester);

    if (cacheKey === this.currentClassOptionsKey && this.isLoadingClasses) {
      return;
    }

    const cachedOptions = this.classOptionsCache.get(cacheKey);
    if (cachedOptions) {
      this.classOptionsRequestId += 1;
      this.currentClassOptionsKey = cacheKey;
      this.classOptions = cachedOptions;
      this.isLoadingClasses = false;
      this.rebuildAssignmentDrafts();
      this.syncSelectedClassOption();
      this.updateDashboardState();
      return;
    }

    const requestId = ++this.classOptionsRequestId;
    this.currentClassOptionsKey = cacheKey;
    this.classOptions = [];
    this.assignmentDrafts = [];
    this.isLoadingClasses = true;
    this.updateDashboardState();
    this.adminService
      .getFacultyWorkloadClassOptions(facultyId, schoolYear, semester)
      .pipe(
        finalize(() => {
          if (requestId === this.classOptionsRequestId) {
            this.isLoadingClasses = false;
            this.updateDashboardState();
          }
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (options) => {
          if (requestId !== this.classOptionsRequestId) {
            return;
          }

          this.classOptions = options ?? [];
          this.classOptionsCache.set(cacheKey, this.classOptions);
          this.rebuildAssignmentDrafts();
          this.syncSelectedClassOption();
        },
        error: (error) => {
          if (requestId !== this.classOptionsRequestId) {
            return;
          }

          this.classOptions = [];
          this.assignmentDrafts = [];
          this.selectedClassKey = '';
          this.currentClassOptionsKey = '';
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private classOptionsCacheKey(
    facultyId: string,
    schoolYear: number,
    semester: string,
  ): string {
    return `${facultyId.toLowerCase()}|${schoolYear}|${semester.toUpperCase()}`;
  }

  private invalidateCurrentClassOptionsCache(): void {
    const facultyId = this.workloadForm.controls.facultyId.value?.trim() ?? '';
    const schoolYear = this.workloadForm.controls.schoolYear.value;
    const semester = this.workloadForm.controls.semester.value?.trim() ?? '';

    if (!facultyId || !schoolYear || !semester) {
      return;
    }

    this.classOptionsCache.delete(
      this.classOptionsCacheKey(facultyId, schoolYear, semester),
    );
    this.currentClassOptionsKey = '';
  }

  private resolveFacultyFromInput(value: string): void {
    const facultyId = value.trim();

    if (!facultyId) {
      this.selectedFaculty = null;
      this.selectedFacultyTermWorkloads = [];
      this.selectedClassKey = '';
      this.classOptions = [];
      this.assignmentDrafts = [];
      this.recalculateWorkload();
      this.updateDashboardState();
      return;
    }

    if (this.selectedFaculty?.facultyId === facultyId) {
      return;
    }

    const localMatch = this.facultyResults.find(
      (faculty) => faculty.facultyId === facultyId,
    );

    if (localMatch) {
      this.applySelectedFaculty(localMatch);
      return;
    }

    this.adminService
      .getFaculties(0, 5, facultyId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          const matches = response.content ?? [];
          const exactMatch = matches.find(
            (faculty) => faculty.facultyId === facultyId,
          );
          const onlyMatch = matches.length === 1 ? matches[0] : null;
          const faculty = exactMatch ?? onlyMatch;

          if (faculty) {
            this.facultyResults = matches;
            this.applySelectedFaculty(faculty);
            return;
          }

          this.selectedFaculty = null;
          this.selectedFacultyTermWorkloads = [];
          this.selectedClassKey = '';
          this.classOptions = [];
          this.assignmentDrafts = [];
          this.workloadSearchTerm = facultyId;
          this.page = 0;
          this.loadWorkloads();
          this.recalculateWorkload();
          this.updateDashboardState();
        },
        error: (error) => {
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private applySelectedFaculty(
    faculty: FetchFacultyResponse,
    updateSearchTerm = true,
  ): void {
    this.selectedFaculty = faculty;
    this.selectedFacultyTermWorkloads = [];
    this.assignmentDrafts = [];

    if (updateSearchTerm) {
      this.facultySearchTerm = this.facultySearchLabel(faculty);
    }

    this.workloadSearchTerm = faculty.facultyId;
    this.page = 0;
    this.workloadForm.patchValue(
      {
        facultyId: faculty.facultyId,
        facultyWorkloadId: null,
        classCode: '',
        courseCode: '',
        programCode: '',
        yearLevel: '',
        sectionCode: '',
        totalHoursPerWeek: 0,
        totalTeachingLoad: 0,
        numberOfPreparations: 0,
        designationEtu: 0,
        totalWorkload: 0,
        overloadHours: 0,
        loadStatus: 'Regular',
        source: 'MANUAL',
        remarks: '',
      },
      { emitEvent: false },
    );
    this.selectedClassKey = '';
    this.markCommonWorkloadControlsPristine();
    this.loadClassOptions();
    this.loadSelectedFacultyTermWorkloads();
    this.loadWorkloads();
    this.recalculateWorkload();
  }

  private patchWorkload(workload: FacultyWorkloadResponse): void {
    this.workloadForm.patchValue(
      {
        facultyWorkloadId: workload.facultyWorkloadId,
        facultyId: workload.facultyId,
        schoolYear: workload.schoolYear,
        semester: this.normalizeSemester(workload.semester),
        classCode: workload.classCode ?? '',
        courseCode: workload.courseCode ?? '',
        programCode: workload.programCode ?? '',
        yearLevel: workload.yearLevel ?? '',
        sectionCode: workload.sectionCode ?? '',
        totalHoursPerWeek: this.toNumber(workload.totalHoursPerWeek),
        totalTeachingLoad: this.toNumber(workload.totalTeachingLoad),
        numberOfPreparations: workload.numberOfPreparations ?? 0,
        designationEtu: this.toNumber(workload.designationEtu),
        totalWorkload: this.toNumber(workload.totalWorkload),
        overloadHours: this.toNumber(workload.overloadHours),
        loadStatus: this.normalizeLoadStatus(workload.loadStatus),
        source: workload.source ?? 'MANUAL',
        remarks: workload.remarks ?? '',
      },
      { emitEvent: false },
    );
    this.loadClassOptions();
    this.syncSelectedClassOption();
  }

  private mergeSavedWorkload(workload: FacultyWorkloadResponse): void {
    const matchingIndex = this.workloads.findIndex(
      (item) =>
        item.facultyWorkloadId === workload.facultyWorkloadId ||
        (
          item.facultyId === workload.facultyId &&
          this.sameTerm(item, workload) &&
          this.sameClassCodeOrLegacyMatch(item, workload) &&
          item.courseCode === workload.courseCode &&
          item.programCode === workload.programCode &&
          item.yearLevel === workload.yearLevel &&
          item.sectionCode === workload.sectionCode
        ),
    );

    if (matchingIndex >= 0) {
      this.workloads = this.workloads.map((item, index) =>
        index === matchingIndex ? workload : item,
      );
      this.updateDashboardState();
      return;
    }

    this.workloads = [workload, ...this.workloads].slice(0, this.pageSize);
    this.totalElements += 1;
    this.totalPages = Math.max(Math.ceil(this.totalElements / this.pageSize), 1);
    this.updateDashboardState();
  }

  private mergeSelectedFacultyTermWorkload(workload: FacultyWorkloadResponse): void {
    const matchesSelectedTerm =
      this.selectedFaculty?.facultyId === workload.facultyId &&
      this.sameSelectedTerm(workload);

    if (!matchesSelectedTerm) {
      return;
    }

    const matchingIndex = this.selectedFacultyTermWorkloads.findIndex(
      (item) =>
        item.facultyWorkloadId === workload.facultyWorkloadId ||
        (
          this.sameClassCodeOrLegacyMatch(item, workload) &&
          item.courseCode === workload.courseCode &&
          item.programCode === workload.programCode &&
          item.yearLevel === workload.yearLevel &&
          item.sectionCode === workload.sectionCode
        ),
    );

    if (matchingIndex >= 0) {
      this.selectedFacultyTermWorkloads = this.selectedFacultyTermWorkloads.map(
        (item, index) => index === matchingIndex ? workload : item,
      );
      return;
    }

    this.selectedFacultyTermWorkloads = [
      workload,
      ...this.selectedFacultyTermWorkloads,
    ];
  }

  private rebuildAssignmentDrafts(): void {
    const assignmentOptions = this.assignmentClassOptions();

    if (!assignmentOptions.length) {
      this.assignmentDrafts = [];
      return;
    }

    const previousDrafts = new Map(
      this.assignmentDrafts.map((draft) => [draft.key, draft]),
    );

    this.assignmentDrafts = assignmentOptions.map((option) => {
      const key = this.classOptionKey(option);
      const previousDraft = previousDrafts.get(key);
      const savedWorkload = this.currentFacultyTermWorkloads().find((workload) =>
        this.workloadMatchesClassOption(workload, option),
      );
      const savedHours = savedWorkload
        ? this.toNumber(savedWorkload.totalHoursPerWeek)
        : previousDraft?.savedTotalHoursPerWeek ?? null;
      const savedStatus = savedWorkload
        ? this.normalizeLoadStatus(savedWorkload.loadStatus)
        : previousDraft?.savedLoadStatus ?? null;
      const keepUnsavedInput = previousDraft
        ? this.isAssignmentDraftDirty(previousDraft)
        : false;

      return {
        key,
        option,
        facultyWorkloadId: savedWorkload?.facultyWorkloadId ?? null,
        totalHoursPerWeek: keepUnsavedInput
          ? previousDraft?.totalHoursPerWeek ?? null
          : savedWorkload
          ? savedHours
          : previousDraft?.totalHoursPerWeek ?? null,
        loadStatus: keepUnsavedInput
          ? previousDraft?.loadStatus ?? 'Regular'
          : savedWorkload
          ? savedStatus ?? 'Regular'
          : previousDraft?.loadStatus ?? 'Regular',
        savedTotalHoursPerWeek: savedHours,
        savedLoadStatus: savedStatus,
        isEncoded: Boolean(savedWorkload),
        isSaving: previousDraft?.isSaving ?? false,
      };
    });
  }

  private assignmentClassOptions(): FacultyWorkloadClassOptionResponse[] {
    const options = [...this.classOptions];

    for (const workload of this.currentFacultyTermWorkloads()) {
      const alreadyListed = options.some((option) =>
        this.workloadMatchesClassOption(workload, option),
      );

      if (!alreadyListed) {
        options.push(this.classOptionFromWorkload(workload));
      }
    }

    return options;
  }

  private classOptionFromWorkload(
    workload: FacultyWorkloadResponse,
  ): FacultyWorkloadClassOptionResponse {
    return {
      classCode: workload.classCode ?? '',
      courseCode: workload.courseCode,
      sectionId: 0,
      programCode: workload.programCode,
      yearLevel: workload.yearLevel,
      sectionCode: workload.sectionCode,
    };
  }

  private patchAssignmentDraftFromWorkload(workload: FacultyWorkloadResponse): void {
    let wasPatched = false;

    this.assignmentDrafts = this.assignmentDrafts.map((draft) => {
      if (!this.workloadMatchesClassOption(workload, draft.option)) {
        return draft;
      }

      wasPatched = true;

      return {
        ...draft,
        facultyWorkloadId: workload.facultyWorkloadId,
        totalHoursPerWeek: this.toNumber(workload.totalHoursPerWeek),
        loadStatus: this.normalizeLoadStatus(workload.loadStatus),
        savedTotalHoursPerWeek: this.toNumber(workload.totalHoursPerWeek),
        savedLoadStatus: this.normalizeLoadStatus(workload.loadStatus),
        isEncoded: true,
        isSaving: false,
      };
    });

    if (!wasPatched) {
      const option = this.classOptionFromWorkload(workload);

      this.assignmentDrafts = [
        {
          key: this.classOptionKey(option),
          option,
          facultyWorkloadId: workload.facultyWorkloadId,
          totalHoursPerWeek: this.toNumber(workload.totalHoursPerWeek),
          loadStatus: this.normalizeLoadStatus(workload.loadStatus),
          savedTotalHoursPerWeek: this.toNumber(workload.totalHoursPerWeek),
          savedLoadStatus: this.normalizeLoadStatus(workload.loadStatus),
          isEncoded: true,
          isSaving: false,
        },
        ...this.assignmentDrafts,
      ];
    }
  }

  private workloadMatchesClassOption(
    workload: FacultyWorkloadResponse,
    option: FacultyWorkloadClassOptionResponse,
  ): boolean {
    return (
      this.sameClassCodeOrLegacyValue(workload.classCode, option.classCode) &&
      workload.courseCode === option.courseCode &&
      workload.programCode === option.programCode &&
      workload.yearLevel === option.yearLevel &&
      workload.sectionCode === option.sectionCode
    );
  }

  private syncSelectedFacultyFromWorkload(workload: FacultyWorkloadResponse): void {
    if (this.selectedFaculty?.facultyId === workload.facultyId) {
      return;
    }

    this.selectedFaculty = {
      facultyId: workload.facultyId,
      firstname: workload.facultyName ?? workload.facultyId,
      lastname: '',
      middlename: '',
      position: '',
      loadLimit: String(workload.loadLimit ?? ''),
      status: '',
      college: workload.college ?? '',
    };
    this.facultySearchTerm = this.facultySearchLabel(this.selectedFaculty);
  }

  private applyCommonFieldsToLocalTerm(savedWorkload: FacultyWorkloadResponse): void {
    this.workloads = this.workloads.map((workload) => {
      if (
        workload.facultyId !== savedWorkload.facultyId ||
        !this.sameTerm(workload, savedWorkload)
      ) {
        return workload;
      }

      return {
        ...workload,
        totalTeachingLoad: savedWorkload.totalTeachingLoad,
        numberOfPreparations: savedWorkload.numberOfPreparations,
        designationEtu: savedWorkload.designationEtu,
        totalWorkload: savedWorkload.totalWorkload,
        overloadHours: savedWorkload.overloadHours,
        loadLimit: savedWorkload.loadLimit,
      };
    });

    this.selectedFacultyTermWorkloads = this.selectedFacultyTermWorkloads.map(
      (workload) => {
        if (
          workload.facultyId !== savedWorkload.facultyId ||
          !this.sameTerm(workload, savedWorkload)
        ) {
          return workload;
        }

        return {
          ...workload,
          totalTeachingLoad: savedWorkload.totalTeachingLoad,
          numberOfPreparations: savedWorkload.numberOfPreparations,
          designationEtu: savedWorkload.designationEtu,
          totalWorkload: savedWorkload.totalWorkload,
          overloadHours: savedWorkload.overloadHours,
          loadLimit: savedWorkload.loadLimit,
        };
      },
    );
  }

  private removeDeletedWorkloadFromLocalState(
    deletedWorkload: FacultyWorkloadResponse,
  ): void {
    const deletedId = deletedWorkload.facultyWorkloadId;
    const beforeCount = this.workloads.length;
    const remainingWorkloads = this.workloads.filter(
      (workload) => workload.facultyWorkloadId !== deletedId,
    );
    const termWorkloads = remainingWorkloads.filter(
      (workload) =>
        workload.facultyId === deletedWorkload.facultyId &&
        this.sameTerm(workload, deletedWorkload),
    );
    const teachingLoad = termWorkloads.reduce(
      (total, workload) => total + this.toNumber(workload.totalHoursPerWeek),
      0,
    );
    const designationEtu = this.toNumber(deletedWorkload.designationEtu);
    const numberOfPreparations = deletedWorkload.numberOfPreparations ?? 0;
    const loadLimit = this.effectiveLoadLimit(numberOfPreparations);
    const totalWorkload = teachingLoad + designationEtu;
    const overloadHours = Math.max(totalWorkload - loadLimit, 0);

    this.workloads = remainingWorkloads.map((workload) => {
      if (
        workload.facultyId !== deletedWorkload.facultyId ||
        !this.sameTerm(workload, deletedWorkload)
      ) {
        return workload;
      }

      return {
        ...workload,
        totalTeachingLoad: teachingLoad,
        totalWorkload,
        overloadHours,
        designationEtu,
        numberOfPreparations,
        loadLimit,
      };
    });

    if (beforeCount !== this.workloads.length) {
      this.totalElements = Math.max(this.totalElements - 1, 0);
      this.totalPages = Math.max(Math.ceil(this.totalElements / this.pageSize), 1);
    }

    this.recalculateWorkload();
    this.updateDashboardState();
  }

  private clearDeletedWorkloadFromForm(
    deletedWorkload: FacultyWorkloadResponse,
  ): void {
    const currentWorkloadId = this.workloadForm.controls.facultyWorkloadId.value;

    if (currentWorkloadId !== deletedWorkload.facultyWorkloadId) {
      return;
    }

    this.workloadForm.patchValue(
      {
        facultyWorkloadId: null,
        classCode: '',
        courseCode: '',
        programCode: '',
        yearLevel: '',
        sectionCode: '',
        totalHoursPerWeek: 0,
      },
      { emitEvent: false },
    );
    this.selectedClassKey = '';
    this.recalculateWorkload();
  }

  private isClassOptionAlreadyEncoded(
    option: FacultyWorkloadClassOptionResponse,
  ): boolean {
    const selectedClassCode =
      this.workloadForm.controls.classCode.value?.trim() ?? '';
    const currentWorkloadId =
      this.workloadForm.controls.facultyWorkloadId.value;

    return this.currentFacultyTermWorkloads().some((workload) => {
      if (currentWorkloadId && workload.facultyWorkloadId === currentWorkloadId) {
        return false;
      }

      const workloadClassCode = workload.classCode?.trim() ?? '';

      return workloadClassCode === option.classCode &&
        workloadClassCode !== selectedClassCode;
    });
  }

  private selectedClassOptionFromForm(): FacultyWorkloadClassOptionResponse | null {
    const facultyWorkloadId = this.workloadForm.controls.facultyWorkloadId.value;
    const classCode = this.workloadForm.controls.classCode.value?.trim() ?? '';
    const courseCode = this.workloadForm.controls.courseCode.value?.trim() ?? '';
    const programCode = this.workloadForm.controls.programCode.value?.trim() ?? '';
    const yearLevel = this.workloadForm.controls.yearLevel.value?.trim() ?? '';
    const sectionCode = this.workloadForm.controls.sectionCode.value?.trim() ?? '';

    if (
      !facultyWorkloadId ||
      !classCode ||
      !courseCode ||
      !programCode ||
      !yearLevel ||
      !sectionCode
    ) {
      return null;
    }

    const existingOption = this.classOptions.find(
      (option) =>
        option.classCode === classCode &&
        option.courseCode === courseCode &&
        option.programCode === programCode &&
        option.yearLevel === yearLevel &&
        option.sectionCode === sectionCode,
    );

    return existingOption ?? {
      classCode,
      courseCode,
      sectionId: 0,
      programCode,
      yearLevel,
      sectionCode,
    };
  }

  private recalculateWorkload(): void {
    const totalHoursPerWeek = this.toNumber(this.workloadForm.controls.totalHoursPerWeek.value);
    const teachingLoad = this.projectedTotalTeachingLoad(totalHoursPerWeek);
    const designationEtu = this.toNumber(this.workloadForm.controls.designationEtu.value);
    const loadLimit = this.effectiveLoadLimit();
    const totalWorkload = teachingLoad + designationEtu;
    const overloadHours = Math.max(totalWorkload - loadLimit, 0);

    this.workloadForm.patchValue(
      {
        totalTeachingLoad: teachingLoad,
        totalWorkload,
        overloadHours,
      },
      { emitEvent: false },
    );
    this.updateDashboardState(teachingLoad, totalWorkload, overloadHours);
  }

  private syncCommonTermFieldsFromWorkloads(): void {
    const commonWorkload = this.currentFacultyTermWorkloads()[0];

    if (!commonWorkload) {
      return;
    }

    const patch: Partial<{
      numberOfPreparations: number;
      designationEtu: number;
    }> = {};

    if (!this.workloadForm.controls.numberOfPreparations.dirty) {
      patch.numberOfPreparations =
        commonWorkload.numberOfPreparations ?? 0;
    }

    if (!this.workloadForm.controls.designationEtu.dirty) {
      patch.designationEtu = this.toNumber(commonWorkload.designationEtu);
    }

    if (Object.keys(patch).length > 0) {
      this.workloadForm.patchValue(patch, { emitEvent: false });
    }
  }

  private markCommonWorkloadControlsPristine(): void {
    this.workloadForm.controls.numberOfPreparations.markAsPristine();
    this.workloadForm.controls.designationEtu.markAsPristine();
  }

  private currentFacultyTermWorkloads(): FacultyWorkloadResponse[] {
    const facultyId = this.workloadForm.controls.facultyId.value;
    const schoolYear = this.workloadForm.controls.schoolYear.value;
    const semester = this.workloadForm.controls.semester.value;

    if (!facultyId || !schoolYear || !semester) {
      return [];
    }

    const selectedFacultySnapshot = this.selectedFacultyTermWorkloads.filter(
      (workload) =>
        workload.facultyId === facultyId &&
        this.sameSchoolYear(workload.schoolYear, schoolYear) &&
        this.sameSemester(workload.semester, semester),
    );

    if (
      this.selectedFaculty?.facultyId === facultyId &&
      selectedFacultySnapshot.length
    ) {
      return selectedFacultySnapshot;
    }

    return this.workloads.filter(
      (workload) =>
        workload.facultyId === facultyId &&
        this.sameSchoolYear(workload.schoolYear, schoolYear) &&
        this.sameSemester(workload.semester, semester),
    );
  }

  private effectiveLoadLimit(
    numberOfPreparations = this.toNumber(
      this.workloadForm.controls.numberOfPreparations.value,
    ),
  ): number {
    return numberOfPreparations >= this.highPreparationThreshold
      ? this.highPreparationLoadLimit
      : this.standardPreparationLoadLimit;
  }

  private scheduleRecalculateWorkload(): void {
    if (this.recalculationTimer) {
      clearTimeout(this.recalculationTimer);
    }

    this.recalculationTimer = setTimeout(() => {
      this.recalculationTimer = null;
      this.recalculateWorkload();
    });
  }

  private updateDashboardState(
    teachingLoad = this.toNumber(this.workloadForm.controls.totalTeachingLoad.value),
    totalWorkload = this.toNumber(this.workloadForm.controls.totalWorkload.value),
    overloadHours = this.toNumber(this.workloadForm.controls.overloadHours.value),
  ): void {
    const facultyId = this.workloadForm.controls.facultyId.value;

    this.selectedFacultyWorkloadCount = facultyId
      ? this.workloads.filter((workload) => workload.facultyId === facultyId).length
      : 0;
    this.projectedTeachingLoadValue = teachingLoad;
    this.projectedTotalWorkloadValue = totalWorkload;
    this.projectedOverloadHoursValue = overloadHours;
    this.visibleHoursPerWeekTotalValue = this.workloads.reduce(
      (total, workload) => total + this.toNumber(workload.totalHoursPerWeek),
      0,
    );
    this.updateFacultySearchVisibility();
    this.requestViewRefresh();
  }

  private updateFacultySearchVisibility(): void {
    this.showFacultySearchResults =
      this.facultyResults.length > 0 ||
      this.isLoadingFaculties ||
      this.facultySearchTerm.trim().length > 0;
    this.requestViewRefresh();
  }

  private requestViewRefresh(): void {
    if (this.viewRefreshPending || this.isDestroyed) {
      return;
    }

    this.viewRefreshPending = true;
    this.viewRefreshTimer = setTimeout(() => {
      this.viewRefreshPending = false;
      this.viewRefreshTimer = null;

      if (!this.isDestroyed) {
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }
    }, 0);
  }

  private buildAssignmentDraftPayload(
    draft: AssignmentWorkloadDraft,
    totals = this.assignmentDraftTotals(draft),
  ): FacultyWorkloadRequest {
    const facultyId = this.workloadForm.controls.facultyId.value ?? '';
    const schoolYear = this.workloadForm.controls.schoolYear.value ?? new Date().getFullYear();
    const semester = this.workloadForm.controls.semester.value ?? 'FIRST_SEMESTER';
    const option = draft.option;

    return {
      facultyWorkloadId: draft.facultyWorkloadId,
      facultyId,
      schoolYear,
      semester,
      classCode: option.classCode?.trim() || null,
      courseCode: option.courseCode,
      programCode: option.programCode,
      yearLevel: option.yearLevel,
      sectionCode: option.sectionCode,
      totalHoursPerWeek: this.toNumber(draft.totalHoursPerWeek),
      totalTeachingLoad: totals.totalTeachingLoad,
      numberOfPreparations: this.workloadForm.controls.numberOfPreparations.value ?? 0,
      designationEtu: this.toNumber(this.workloadForm.controls.designationEtu.value),
      totalWorkload: totals.totalWorkload,
      overloadHours: totals.overloadHours,
      loadStatus: this.normalizeLoadStatus(draft.loadStatus),
      source: this.workloadForm.controls.source.value ?? 'MANUAL',
      remarks: this.workloadForm.controls.remarks.value?.trim() || null,
    };
  }

  private assignmentDraftTotals(draft: AssignmentWorkloadDraft): {
    totalTeachingLoad: number;
    totalWorkload: number;
    overloadHours: number;
  } {
    const currentHours = this.toNumber(draft.totalHoursPerWeek);
    const savedHours = this.currentFacultyTermWorkloads()
      .filter((workload) => !this.workloadMatchesClassOption(workload, draft.option))
      .reduce(
        (total, workload) => total + this.toNumber(workload.totalHoursPerWeek),
        0,
      );
    const totalTeachingLoad = savedHours + currentHours;
    const designationEtu = this.toNumber(this.workloadForm.controls.designationEtu.value);
    const totalWorkload = totalTeachingLoad + designationEtu;
    const overloadHours = Math.max(
      totalWorkload - this.effectiveLoadLimit(),
      0,
    );

    return {
      totalTeachingLoad,
      totalWorkload,
      overloadHours,
    };
  }

  private normalizeLoadStatus(
    status: FacultyLoadStatus | string | null | undefined,
  ): FacultyLoadStatus {
    return String(status ?? '').toLowerCase().includes('overload')
      ? 'Overload'
      : 'Regular';
  }

  private normalizeSemester(
    semester: string | null | undefined,
  ): Semester {
    const normalized = String(semester ?? '')
      .trim()
      .toLowerCase()
      .replace(/[_-]/g, ' ');

    if (
      normalized.includes('summer') ||
      normalized.includes('midyear') ||
      normalized === '3' ||
      normalized.includes('3rd')
    ) {
      return 'SUMMER_SEMESTER';
    }

    if (
      normalized.includes('second') ||
      normalized.includes('2nd') ||
      normalized === '2'
    ) {
      return 'SECOND_SEMESTER';
    }

    return 'FIRST_SEMESTER';
  }

  private sameSemester(
    first: string | null | undefined,
    second: string | null | undefined,
  ): boolean {
    return this.normalizeSemester(first) === this.normalizeSemester(second);
  }

  private sameSchoolYear(
    first: string | number | null | undefined,
    second: string | number | null | undefined,
  ): boolean {
    return this.toNumber(first) === this.toNumber(second);
  }

  private sameTerm(
    first: Pick<FacultyWorkloadResponse, 'schoolYear' | 'semester'>,
    second: Pick<FacultyWorkloadResponse, 'schoolYear' | 'semester'>,
  ): boolean {
    return this.sameSchoolYear(first.schoolYear, second.schoolYear) &&
      this.sameSemester(first.semester, second.semester);
  }

  private sameSelectedTerm(workload: FacultyWorkloadResponse): boolean {
    return this.sameSchoolYear(
      workload.schoolYear,
      this.workloadForm.controls.schoolYear.value,
    ) && this.sameSemester(
      workload.semester,
      this.workloadForm.controls.semester.value,
    );
  }

  private toNumber(value: string | number | null | undefined): number {
    return Number(value ?? 0) || 0;
  }

  private projectedTotalTeachingLoad(currentHoursPerWeek: number): number {
    const facultyId = this.workloadForm.controls.facultyId.value;
    const schoolYear = this.workloadForm.controls.schoolYear.value;
    const semester = this.workloadForm.controls.semester.value;
    const currentWorkloadId = this.workloadForm.controls.facultyWorkloadId.value;
    const classCode = this.workloadForm.controls.classCode.value;
    const courseCode = this.workloadForm.controls.courseCode.value;
    const programCode = this.workloadForm.controls.programCode.value;
    const yearLevel = this.workloadForm.controls.yearLevel.value;
    const sectionCode = this.workloadForm.controls.sectionCode.value;

    if (!facultyId || !schoolYear || !semester) {
      return currentHoursPerWeek;
    }

    const termWorkloads = this.workloads.filter(
      (workload) =>
        workload.facultyId === facultyId &&
        this.sameSchoolYear(workload.schoolYear, schoolYear) &&
        this.sameSemester(workload.semester, semester),
    );
    const savedAggregate = termWorkloads.length
      ? Math.max(
          ...termWorkloads.map((workload) =>
            this.toNumber(workload.totalTeachingLoad),
          ),
        )
      : 0;
    const existingCurrentHours = termWorkloads
      .filter(
        (workload) =>
          workload.facultyWorkloadId === currentWorkloadId ||
          (
            this.sameClassCodeOrLegacyValue(workload.classCode, classCode) &&
            workload.courseCode === courseCode &&
            workload.programCode === programCode &&
            workload.yearLevel === yearLevel &&
            workload.sectionCode === sectionCode
          ),
      )
      .reduce(
        (total, workload) => total + this.toNumber(workload.totalHoursPerWeek),
        0,
      );

    if (savedAggregate > 0 || currentWorkloadId) {
      return Math.max(savedAggregate - existingCurrentHours, 0) + currentHoursPerWeek;
    }

    const visibleSavedHours = termWorkloads.reduce(
      (total, workload) => total + this.toNumber(workload.totalHoursPerWeek),
      0,
    );

    return visibleSavedHours + currentHoursPerWeek;
  }

  private syncSelectedClassOption(): void {
    const classCode = this.workloadForm.controls.classCode.value;
    const courseCode = this.workloadForm.controls.courseCode.value;
    const programCode = this.workloadForm.controls.programCode.value;
    const yearLevel = this.workloadForm.controls.yearLevel.value;
    const sectionCode = this.workloadForm.controls.sectionCode.value;
    const matchingOption = this.classOptions.find(
      (option) =>
        (
          option.classCode === classCode ||
          (!classCode && option.courseCode === courseCode)
        ) &&
        option.courseCode === courseCode &&
        option.programCode === programCode &&
        option.yearLevel === yearLevel &&
        option.sectionCode === sectionCode,
    );
    const selectedOption = this.selectedClassOptionFromForm();

    this.selectedClassKey = matchingOption
      ? this.classOptionKey(matchingOption)
      : selectedOption
        ? this.classOptionKey(selectedOption)
        : '';
  }

  private sameClassCodeOrLegacyMatch(
    first: FacultyWorkloadResponse,
    second: FacultyWorkloadResponse,
  ): boolean {
    return this.sameClassCodeOrLegacyValue(first.classCode, second.classCode);
  }

  private sameClassCodeOrLegacyValue(
    first: string | null | undefined,
    second: string | null | undefined,
  ): boolean {
    const normalizedFirst = first?.trim() ?? '';
    const normalizedSecond = second?.trim() ?? '';

    return !normalizedFirst
      || !normalizedSecond
      || normalizedFirst === normalizedSecond;
  }

  classOptionKey(option: FacultyWorkloadClassOptionResponse): string {
    return [
      option.classCode,
      option.courseCode,
      option.sectionId,
      option.programCode,
      option.yearLevel,
      option.sectionCode,
    ].join('|');
  }

  private clearClassSelection(): void {
    this.selectedClassKey = '';
    this.workloadForm.patchValue({
      classCode: '',
      courseCode: '',
      programCode: '',
      yearLevel: '',
      sectionCode: '',
    });
  }
}
