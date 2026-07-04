import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  AdminService,
  FacultyLoadStatus,
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
  debounceTime,
  distinctUntilChanged,
  finalize,
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
  private readonly destroy$ = new Subject<void>();
  private readonly facultySearch$ = new Subject<string>();
  private readonly workloadSearch$ = new Subject<string>();

  readonly semesterOptions: Array<{ label: string; value: Semester }> = [
    { label: 'First Semester', value: 'FIRST_SEMESTER' },
    { label: 'Second Semester', value: 'SECOND_SEMESTER' },
    { label: 'Summer Semester', value: 'SUMMER_SEMESTER' },
  ];
  readonly sourceOptions = ['MANUAL', 'IMPORTED', 'SYSTEM'] as const;

  facultyResults: FetchFacultyResponse[] = [];
  workloads: FacultyWorkloadResponse[] = [];
  selectedFaculty: FetchFacultyResponse | null = null;
  facultySearchTerm = '';
  workloadSearchTerm = '';
  page = 0;
  pageSize = 10;
  totalElements = 0;
  totalPages = 1;
  isLoadingFaculties = false;
  isLoadingWorkloads = false;
  isSaving = false;
  selectedLoadStatus: FacultyLoadStatus = 'REGULAR_LOAD';

  workloadForm = this.fb.group({
    facultyWorkloadId: [null as number | null],
    facultyId: ['', Validators.required],
    schoolYear: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    semester: ['FIRST_SEMESTER' as Semester, Validators.required],
    courseCode: ['', Validators.required],
    programCode: ['', Validators.required],
    yearLevel: ['', Validators.required],
    sectionCode: ['', Validators.required],
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
    this.initializeWorkloadCalculation();
    this.loadWorkloads();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFacultySearchChange(value: string): void {
    this.facultySearch$.next(value);
  }

  onWorkloadSearchChange(value: string): void {
    this.workloadSearch$.next(value);
  }

  selectFaculty(faculty: FetchFacultyResponse): void {
    this.selectedFaculty = faculty;
    this.workloadForm.patchValue({
      facultyId: faculty.facultyId,
      facultyWorkloadId: null,
    });
    this.recalculateWorkload();
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
    this.patchWorkload(workload);
  }

  clearForm(): void {
    const schoolYear = this.workloadForm.controls.schoolYear.value ?? new Date().getFullYear();
    const semester = this.workloadForm.controls.semester.value ?? 'FIRST_SEMESTER';

    this.selectedFaculty = null;
    this.selectedLoadStatus = 'REGULAR_LOAD';
    this.workloadForm.reset({
      facultyId: '',
      facultyWorkloadId: null,
      schoolYear,
      semester,
      courseCode: '',
      programCode: '',
      yearLevel: '',
      sectionCode: '',
      totalTeachingLoad: 0,
      numberOfPreparations: 0,
      designationEtu: 0,
      totalWorkload: 0,
      overloadHours: 0,
      source: 'MANUAL',
      remarks: '',
    });
  }

  saveWorkload(): void {
    if (this.workloadForm.invalid) {
      this.workloadForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.adminService
      .upsertFacultyWorkload(this.buildPayload())
      .pipe(
        finalize(() => {
          this.isSaving = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.patchWorkload(response);
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
          this.loadWorkloads();
        },
        error: () => {
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
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$),
      )
      .subscribe((value) => {
        this.searchFaculties(value);
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

  private initializeWorkloadCalculation(): void {
    this.workloadForm.controls.totalTeachingLoad.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalculateWorkload());

    this.workloadForm.controls.designationEtu.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.recalculateWorkload());

    this.workloadForm.controls.schoolYear.valueChanges
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => this.refreshTermWorkloads());

    this.workloadForm.controls.semester.valueChanges
      .pipe(debounceTime(250), takeUntil(this.destroy$))
      .subscribe(() => this.refreshTermWorkloads());
  }

  private searchFaculties(search: string): void {
    const normalizedSearch = search.trim();

    if (!normalizedSearch) {
      this.facultyResults = [];
      return;
    }

    this.isLoadingFaculties = true;
    this.adminService
      .getFaculties(0, 8, normalizedSearch)
      .pipe(
        finalize(() => {
          this.isLoadingFaculties = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.facultyResults = response.content ?? [];
        },
        error: (error) => {
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private loadWorkloads(): void {
    this.isLoadingWorkloads = true;
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
          this.isLoadingWorkloads = false;
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (response) => {
          this.workloads = response.content ?? [];
          this.totalElements = response.totalElements ?? 0;
          this.totalPages = Math.max(response.totalPages ?? 1, 1);
        },
        error: (error) => {
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  private refreshTermWorkloads(): void {
    this.page = 0;
    this.loadWorkloads();

  }

  private patchWorkload(workload: FacultyWorkloadResponse): void {
    this.selectedLoadStatus = workload.loadStatus ?? 'REGULAR_LOAD';
    this.workloadForm.patchValue(
      {
        facultyWorkloadId: workload.facultyWorkloadId,
        facultyId: workload.facultyId,
        schoolYear: workload.schoolYear,
        semester: workload.semester as Semester,
        courseCode: workload.courseCode ?? '',
        programCode: workload.programCode ?? '',
        yearLevel: workload.yearLevel ?? '',
        sectionCode: workload.sectionCode ?? '',
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
  }

  private recalculateWorkload(): void {
    const teachingLoad = this.toNumber(this.workloadForm.controls.totalTeachingLoad.value);
    const designationEtu = this.toNumber(this.workloadForm.controls.designationEtu.value);
    const loadLimit = this.toNumber(this.selectedFaculty?.loadLimit);
    const totalWorkload = teachingLoad + designationEtu;
    const overloadHours = Math.max(totalWorkload - loadLimit, 0);

    this.selectedLoadStatus = overloadHours > 0 ? 'OVERLOAD' : 'REGULAR_LOAD';
    this.workloadForm.patchValue(
      {
        totalWorkload,
        overloadHours,
      },
      { emitEvent: false },
    );
  }

  private buildPayload(): FacultyWorkloadRequest {
    const value = this.workloadForm.getRawValue();

    return {
      facultyWorkloadId: value.facultyWorkloadId,
      facultyId: value.facultyId ?? '',
      schoolYear: value.schoolYear ?? new Date().getFullYear(),
      semester: value.semester ?? 'FIRST_SEMESTER',
      courseCode: value.courseCode?.trim() ?? '',
      programCode: value.programCode?.trim() ?? '',
      yearLevel: value.yearLevel?.trim() ?? '',
      sectionCode: value.sectionCode?.trim() ?? '',
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
}
