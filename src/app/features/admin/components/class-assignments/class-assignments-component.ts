import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AdminService,
  ClassFacultyAssignmentResponse,
  CurrentSchoolYearAndSemesterResponse,
  FacultyAssignmentOptionResponse,
} from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-class-assignments',
  standalone: true,
  imports: [CommonModule, FormsModule, UnicodeTextPipe],
  templateUrl: './class-assignments-component.html',
  styleUrl: './class-assignments-component.css',
})
export class ClassAssignmentsComponent implements OnInit, OnDestroy {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);
  private readonly facultyOptionsCache = new Map<string, FacultyAssignmentOptionResponse[]>();
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly assignments = signal<ClassFacultyAssignmentResponse[]>([]);
  readonly currentTerm = signal<CurrentSchoolYearAndSemesterResponse | null>(null);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly pageIndex = signal(0);
  readonly pageSize = signal(20);
  readonly searchTerm = signal('');
  readonly legacyDatabase = signal('');
  readonly isLoading = signal(false);
  readonly isRefreshing = signal(false);
  readonly selectedAssignment = signal<ClassFacultyAssignmentResponse | null>(null);
  readonly facultyOptions = signal<FacultyAssignmentOptionResponse[]>([]);
  readonly selectedFacultyId = signal('');
  readonly isLoadingOptions = signal(false);
  readonly isSaving = signal(false);

  readonly pageSizes = [10, 20, 50, 100];
  readonly databaseOptions = [
    { value: '', label: 'All campuses' },
    { value: 'LEGACY_TALISAY', label: 'Talisay' },
    { value: 'LEGACY_ALIJIS', label: 'Alijis' },
    { value: 'LEGACY_FT', label: 'Fortune Towne' },
    { value: 'LEGACY_BINALBAGAN', label: 'Binalbagan' },
  ];

  readonly pageStart = computed(() =>
    this.totalElements() === 0 ? 0 : this.pageIndex() * this.pageSize() + 1,
  );
  readonly pageEnd = computed(() =>
    Math.min((this.pageIndex() + 1) * this.pageSize(), this.totalElements()),
  );
  readonly canSave = computed(() => {
    const assignment = this.selectedAssignment();
    return Boolean(
      assignment
      && this.selectedFacultyId()
      && this.selectedFacultyId() !== assignment.facultyId
      && !this.isSaving(),
    );
  });
  readonly selectedFaculty = computed(() =>
    this.facultyOptions().find(
      (faculty) => faculty.facultyId === this.selectedFacultyId(),
    ) ?? null,
  );

  ngOnInit(): void {
    this.adminService.fetchCurrentSchoolYearAndSemester().subscribe({
      next: (term) => this.currentTerm.set(term),
      error: (error) => this.toastFacade.showToast(extractErrorMessage(error), 'error'),
    });
    this.loadAssignments();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }

  loadAssignments(refresh = false): void {
    this.isLoading.set(true);
    this.isRefreshing.set(refresh);

    this.adminService.getClassAssignments(
      this.pageIndex(),
      this.pageSize(),
      this.searchTerm(),
      this.legacyDatabase(),
    ).pipe(
      finalize(() => {
        this.isLoading.set(false);
        this.isRefreshing.set(false);
      }),
    ).subscribe({
      next: (response) => {
        this.assignments.set(response.content);
        this.totalElements.set(response.totalElements);
        this.totalPages.set(response.totalPages);

        if (response.totalPages > 0 && this.pageIndex() >= response.totalPages) {
          this.pageIndex.set(response.totalPages - 1);
          this.loadAssignments();
        }
      },
      error: (error) => {
        this.assignments.set([]);
        this.totalElements.set(0);
        this.totalPages.set(0);
        this.toastFacade.showToast(extractErrorMessage(error), 'error');
      },
    });
  }

  updateSearch(value: string): void {
    this.searchTerm.set(value);
    this.pageIndex.set(0);

    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }

    this.searchTimer = setTimeout(() => this.loadAssignments(), 350);
  }

  updateDatabase(value: string): void {
    this.legacyDatabase.set(value);
    this.pageIndex.set(0);
    this.loadAssignments();
  }

  updatePageSize(value: number | string): void {
    this.pageSize.set(Number(value) || 20);
    this.pageIndex.set(0);
    this.loadAssignments();
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.pageIndex()) {
      return;
    }

    this.pageIndex.set(page);
    this.loadAssignments();
  }

  clearFilters(): void {
    this.searchTerm.set('');
    this.legacyDatabase.set('');
    this.pageIndex.set(0);
    this.loadAssignments();
  }

  openReassignment(assignment: ClassFacultyAssignmentResponse): void {
    this.selectedAssignment.set(assignment);
    this.selectedFacultyId.set(assignment.facultyId ?? '');
    this.loadFacultyOptions(assignment.legacyDatabase ?? '');
  }

  closeReassignment(): void {
    if (this.isSaving()) {
      return;
    }

    this.selectedAssignment.set(null);
    this.selectedFacultyId.set('');
    this.facultyOptions.set([]);
  }

  saveReassignment(): void {
    const assignment = this.selectedAssignment();
    if (!assignment || !this.canSave()) {
      return;
    }

    this.isSaving.set(true);
    this.adminService.reassignClassFaculty(
      assignment.primaryClassId,
      this.selectedFacultyId(),
      assignment.facultyId,
    ).pipe(
      finalize(() => this.isSaving.set(false)),
    ).subscribe({
      next: (response) => {
        this.assignments.update((rows) =>
          rows.map((row) =>
            row.primaryClassId === response.assignment.primaryClassId
              ? response.assignment
              : row,
          ),
        );
        this.toastFacade.showToast(
          response.changed
            ? 'Class faculty assignment updated successfully.'
            : 'The class assignment is already up to date.',
          'success',
        );
        this.closeReassignment();
      },
      error: (error) => {
        this.toastFacade.showToast(extractErrorMessage(error), 'error');
      },
    });
  }

  semesterLabel(value: string): string {
    const labels: Record<string, string> = {
      '1st': 'First Semester',
      '2nd': 'Second Semester',
      summer: 'Summer Semester',
    };
    return labels[value] ?? value;
  }

  databaseLabel(value: string | null): string {
    return this.databaseOptions.find((option) => option.value === value)?.label
      ?? value?.replace('LEGACY_', '').replaceAll('_', ' ')
      ?? 'Unknown source';
  }

  trackByClassId(_: number, assignment: ClassFacultyAssignmentResponse): number {
    return assignment.primaryClassId;
  }

  private loadFacultyOptions(legacyDatabase: string): void {
    const cached = this.facultyOptionsCache.get(legacyDatabase);
    if (cached) {
      this.facultyOptions.set(cached);
      return;
    }

    this.isLoadingOptions.set(true);
    this.adminService.getClassAssignmentFacultyOptions(legacyDatabase).pipe(
      finalize(() => this.isLoadingOptions.set(false)),
    ).subscribe({
      next: (options) => {
        this.facultyOptionsCache.set(legacyDatabase, options);
        this.facultyOptions.set(options);
      },
      error: (error) => {
        this.toastFacade.showToast(extractErrorMessage(error), 'error');
        this.closeReassignment();
      },
    });
  }
}
