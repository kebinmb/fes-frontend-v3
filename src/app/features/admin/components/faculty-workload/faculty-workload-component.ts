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
  private readonly destroy$ = new Subject<void>();
  private readonly facultySearch$ = new Subject<string>();
  private readonly workloadSearch$ = new Subject<string>();
  private facultySearchRequestId = 0;
  private classOptionsRequestId = 0;
  private workloadRequestId = 0;
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
  private isDestroyed = false;

  readonly semesterOptions: Array<{ label: string; value: Semester }> = [
    { label: 'First Semester', value: 'FIRST_SEMESTER' },
    { label: 'Second Semester', value: 'SECOND_SEMESTER' },
    { label: 'Summer Semester', value: 'SUMMER_SEMESTER' },
  ];
  readonly sourceOptions = ['MANUAL', 'IMPORTED', 'SYSTEM'] as const;

  facultyResults: FetchFacultyResponse[] = [];
  workloads: FacultyWorkloadResponse[] = [];
  classOptions: FacultyWorkloadClassOptionResponse[] = [];
  selectedFaculty: FetchFacultyResponse | null = null;
  selectedClassKey = '';
  facultySearchTerm = '';
  workloadSearchTerm = '';
  page = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  isLoadingFaculties = false;
  isLoadingWorkloads = false;
  isLoadingClasses = false;
  isSaving = false;
  selectedLoadStatus: FacultyLoadStatus = 'REGULAR_LOAD';
  selectedFacultyWorkloadCount = 0;
  projectedTeachingLoadValue = 0;
  projectedTotalWorkloadValue = 0;
  projectedOverloadHoursValue = 0;
  visibleHoursPerWeekTotalValue = 0;
  showFacultySearchResults = false;
  canSaveWorkloadValue = false;

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
    source: ['MANUAL' as FacultyWorkloadSource, Validators.required],
    remarks: [''],
  });

  ngOnInit(): void {
    this.initializeCurrentTerm();
    this.initializeSearch();
    this.initializeFacultyIdLookup();
    this.initializeWorkloadCalculation();
    this.searchFaculties('');
    this.loadWorkloads();
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;

    if (this.recalculationTimer) {
      clearTimeout(this.recalculationTimer);
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

  selectFaculty(faculty: FetchFacultyResponse): void {
    this.applySelectedFaculty(faculty);
  }

  editWorkload(workload: FacultyWorkloadResponse): void {
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
  }

  clearForm(): void {
    const schoolYear = this.workloadForm.controls.schoolYear.value ?? new Date().getFullYear();
    const semester = this.workloadForm.controls.semester.value ?? 'FIRST_SEMESTER';

    this.selectedFaculty = null;
    this.selectedLoadStatus = 'REGULAR_LOAD';
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
      source: 'MANUAL',
      remarks: '',
    });
    this.selectedClassKey = '';
    this.classOptions = [];
    this.searchFaculties('');
    this.loadWorkloads();
    this.updateDashboardState(0, 0, 0);
  }

  saveWorkload(): void {
    if (this.workloadForm.invalid) {
      this.workloadForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.updateDashboardState();
    this.adminService
      .upsertFacultyWorkload(this.buildPayload())
      .pipe(
        finalize(() => {
          this.isSaving = false;
          this.updateDashboardState();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.workloadSearchTerm = response.facultyId;
          this.page = 0;
          this.mergeSavedWorkload(response);
          this.applyCommonFieldsToLocalTerm(response);
          this.syncSelectedFacultyFromWorkload(response);
          this.clearSubjectSpecificWorkloadFields();
          this.toastFacade.showToast('Faculty workload saved successfully.', 'success');
          this.loadWorkloads();
        },
        error: (error) => {
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
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

  statusLabel(status: FacultyLoadStatus | null | undefined): string {
    return status === 'OVERLOAD' ? 'Overload' : 'Regular Load';
  }

  semesterLabel(semester: string | null | undefined): string {
    return (
      this.semesterOptions.find((option) => option.value === semester)?.label ??
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
    return this.classOptions.filter(
      (option) => !this.isClassOptionAlreadyEncoded(option),
    );
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
    ].join(' · ');
  }

  get selectedFacultyLoadLimit(): string {
    return String(this.effectiveLoadLimit());
  }

  get canSaveWorkload(): boolean {
    return this.workloadForm.valid && !this.isSaving && !this.isLoadingClasses;
  }

  onClassOptionChange(classKey: string): void {
    this.selectedClassKey = classKey;
    const option = this.classOptions.find(
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
            semester: term.semester as Semester,
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
        },
        error: (error) => {
          if (requestId !== this.workloadRequestId) {
            return;
          }

          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private refreshTermWorkloads(): void {
    this.page = 0;
    this.clearClassSelection();
    this.loadClassOptions();
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
      this.syncSelectedClassOption();
      this.updateDashboardState();
      return;
    }

    const requestId = ++this.classOptionsRequestId;
    this.currentClassOptionsKey = cacheKey;
    this.classOptions = [];
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
          this.syncSelectedClassOption();
        },
        error: (error) => {
          if (requestId !== this.classOptionsRequestId) {
            return;
          }

          this.classOptions = [];
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

  private resolveFacultyFromInput(value: string): void {
    const facultyId = value.trim();

    if (!facultyId) {
      this.selectedFaculty = null;
      this.selectedClassKey = '';
      this.classOptions = [];
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
          this.selectedClassKey = '';
          this.classOptions = [];
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
        source: 'MANUAL',
        remarks: '',
      },
      { emitEvent: false },
    );
    this.selectedClassKey = '';
    this.markCommonWorkloadControlsPristine();
    this.loadClassOptions();
    this.loadWorkloads();
    this.recalculateWorkload();
  }

  private patchWorkload(workload: FacultyWorkloadResponse): void {
    this.selectedLoadStatus = workload.loadStatus ?? 'REGULAR_LOAD';
    this.workloadForm.patchValue(
      {
        facultyWorkloadId: workload.facultyWorkloadId,
        facultyId: workload.facultyId,
        schoolYear: workload.schoolYear,
        semester: workload.semester as Semester,
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
          item.schoolYear === workload.schoolYear &&
          item.semester === workload.semester &&
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

  private clearSubjectSpecificWorkloadFields(): void {
    this.workloadForm.patchValue(
      {
        facultyWorkloadId: null,
        classCode: '',
        courseCode: '',
        programCode: '',
        yearLevel: '',
        sectionCode: '',
        totalHoursPerWeek: 0,
        totalTeachingLoad: this.projectedTeachingLoadValue,
        totalWorkload: this.projectedTotalWorkloadValue,
        overloadHours: this.projectedOverloadHoursValue,
      },
      { emitEvent: false },
    );
    this.selectedClassKey = '';
    this.workloadForm.controls.totalHoursPerWeek.markAsPristine();
    this.recalculateWorkload();
  }

  private applyCommonFieldsToLocalTerm(savedWorkload: FacultyWorkloadResponse): void {
    this.workloads = this.workloads.map((workload) => {
      if (
        workload.facultyId !== savedWorkload.facultyId ||
        workload.schoolYear !== savedWorkload.schoolYear ||
        workload.semester !== savedWorkload.semester
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
        loadStatus: savedWorkload.loadStatus,
        loadLimit: savedWorkload.loadLimit,
      };
    });
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

  private recalculateWorkload(): void {
    const totalHoursPerWeek = this.toNumber(this.workloadForm.controls.totalHoursPerWeek.value);
    const teachingLoad = this.projectedTotalTeachingLoad(totalHoursPerWeek);
    const designationEtu = this.toNumber(this.workloadForm.controls.designationEtu.value);
    const loadLimit = this.effectiveLoadLimit();
    const totalWorkload = teachingLoad + designationEtu;
    const overloadHours = Math.max(totalWorkload - loadLimit, 0);

    this.selectedLoadStatus = overloadHours > 0 ? 'OVERLOAD' : 'REGULAR_LOAD';
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

    return this.workloads.filter(
      (workload) =>
        workload.facultyId === facultyId &&
        workload.schoolYear === schoolYear &&
        workload.semester === semester,
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
    this.canSaveWorkloadValue =
      this.workloadForm.valid && !this.isSaving && !this.isLoadingClasses;
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
    queueMicrotask(() => {
      this.viewRefreshPending = false;

      if (!this.isDestroyed) {
        this.cdr.detectChanges();
      }
    });
  }

  private buildPayload(): FacultyWorkloadRequest {
    const value = this.workloadForm.getRawValue();

    return {
      facultyWorkloadId: value.facultyWorkloadId,
      facultyId: value.facultyId ?? '',
      schoolYear: value.schoolYear ?? new Date().getFullYear(),
      semester: value.semester ?? 'FIRST_SEMESTER',
      classCode: value.classCode?.trim() || null,
      courseCode: value.courseCode?.trim() ?? '',
      programCode: value.programCode?.trim() ?? '',
      yearLevel: value.yearLevel?.trim() ?? '',
      sectionCode: value.sectionCode?.trim() ?? '',
      totalHoursPerWeek: this.toNumber(value.totalHoursPerWeek),
      totalTeachingLoad: this.toNumber(value.totalTeachingLoad),
      numberOfPreparations: value.numberOfPreparations ?? 0,
      designationEtu: this.toNumber(value.designationEtu),
      totalWorkload: this.toNumber(value.totalWorkload),
      overloadHours: this.toNumber(value.overloadHours),
      source: value.source ?? 'MANUAL',
      remarks: value.remarks?.trim() || null,
    };
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
        workload.schoolYear === schoolYear &&
        workload.semester === semester,
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

    this.selectedClassKey = matchingOption
      ? this.classOptionKey(matchingOption)
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
