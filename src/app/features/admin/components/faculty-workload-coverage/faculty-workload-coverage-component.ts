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
import { RouterLink } from '@angular/router';
import {
  AdminService,
  FacultyWorkloadCoverageFacultyResponse,
  FacultyWorkloadCoverageResponse,
} from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { finalize } from 'rxjs';

type CoverageTab = 'without' | 'with';
type SortDirection = 'asc' | 'desc';
type PreparationFilter = 'all' | 'none' | 'one' | 'two' | 'three-plus';
type SortColumn =
  | 'facultyName'
  | 'facultyId'
  | 'position'
  | 'college'
  | 'loadLimit'
  | 'workloadCount'
  | 'totalHoursPerWeek'
  | 'numberOfPreparations';

interface SortState {
  column: SortColumn;
  direction: SortDirection;
}

@Component({
  selector: 'app-faculty-workload-coverage-component',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UnicodeTextPipe],
  templateUrl: './faculty-workload-coverage-component.html',
  styleUrl: './faculty-workload-coverage-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacultyWorkloadCoverageComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);
  private readonly destroyRef = inject(DestroyRef);

  coverage = signal<FacultyWorkloadCoverageResponse | null>(null);
  activeTab = signal<CoverageTab>('without');
  searchTerm = signal('');
  collegeFilter = signal('all');
  positionFilter = signal('all');
  preparationFilter = signal<PreparationFilter>('all');
  sortState = signal<SortState>({
    column: 'facultyName',
    direction: 'asc',
  });
  pageIndex = signal(0);
  pageSize = signal(10);
  isLoading = signal(false);
  isRefreshing = signal(false);

  readonly pageSizes = [10, 25, 50, 100];

  baseRows = computed(() => {
    const data = this.coverage();

    return this.activeTab() === 'without'
      ? data?.withoutWorkload ?? []
      : data?.withWorkload ?? [];
  });

  collegeOptions = computed(() => this.uniqueOptions('college'));

  positionOptions = computed(() => this.uniqueOptions('position'));

  filteredRows = computed(() => {
    const rows = this.baseRows();
    const search = this.searchTerm().trim().toLowerCase();
    const college = this.collegeFilter();
    const position = this.positionFilter();
    const preparation = this.preparationFilter();

    return rows.filter((row) => {
      const matchesSearch = !search || [
        row.facultyId,
        row.facultyName,
        row.college,
        row.position,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search);

      const matchesCollege = college === 'all' || row.college === college;
      const matchesPosition = position === 'all' || row.position === position;
      const matchesPreparation = this.matchesPreparationFilter(
        row,
        preparation,
      );

      return matchesSearch
        && matchesCollege
        && matchesPosition
        && matchesPreparation;
    });
  });

  sortedRows = computed(() => {
    const sort = this.sortState();

    return [...this.filteredRows()].sort((left, right) => {
      const comparison = this.compareRows(left, right, sort.column);
      return sort.direction === 'asc' ? comparison : -comparison;
    });
  });

  paginatedRows = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.sortedRows().slice(start, start + this.pageSize());
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.sortedRows().length / this.pageSize())),
  );

  pageStart = computed(() =>
    this.sortedRows().length === 0 ? 0 : this.pageIndex() * this.pageSize() + 1,
  );

  pageEnd = computed(() =>
    Math.min((this.pageIndex() + 1) * this.pageSize(), this.sortedRows().length),
  );

  paginationPages = computed(() => {
    const total = this.totalPages();
    const current = this.pageIndex();
    const start = Math.max(0, Math.min(current - 2, total - 5));
    const end = Math.min(total, start + 5);

    return Array.from({ length: end - start }, (_, index) => start + index);
  });

  ngOnInit(): void {
    this.loadCoverage();
  }

  loadCoverage(forceRefresh = false): void {
    this.isLoading.set(true);
    this.isRefreshing.set(forceRefresh);

    this.adminService
      .getFacultyWorkloadCoverage(forceRefresh)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        }),
      )
      .subscribe({
        next: (response) => {
          this.coverage.set(response);
          this.ensureValidPage();
        },
        error: (error) => {
          this.coverage.set(null);
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  setActiveTab(tab: CoverageTab): void {
    this.activeTab.set(tab);
    this.resetPage();
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.resetPage();
  }

  clearSearch(): void {
    this.searchTerm.set('');
    this.resetPage();
  }

  updateCollegeFilter(value: string): void {
    this.collegeFilter.set(value);
    this.resetPage();
  }

  updatePositionFilter(value: string): void {
    this.positionFilter.set(value);
    this.resetPage();
  }

  updatePreparationFilter(value: PreparationFilter): void {
    this.preparationFilter.set(value);
    this.resetPage();
  }

  updatePageSize(value: string | number): void {
    this.pageSize.set(Number(value) || 10);
    this.resetPage();
  }

  sortBy(column: SortColumn): void {
    const current = this.sortState();

    this.sortState.set({
      column,
      direction: current.column === column && current.direction === 'asc'
        ? 'desc'
        : 'asc',
    });

    this.resetPage();
  }

  goToPage(index: number): void {
    const nextPage = Math.min(Math.max(index, 0), this.totalPages() - 1);
    this.pageIndex.set(nextPage);
  }

  resetFilters(): void {
    this.searchTerm.set('');
    this.collegeFilter.set('all');
    this.positionFilter.set('all');
    this.preparationFilter.set('all');
    this.sortState.set({
      column: 'facultyName',
      direction: 'asc',
    });
    this.resetPage();
  }

  sortIcon(column: SortColumn): string {
    const sort = this.sortState();

    if (sort.column !== column) {
      return 'bi-arrow-down-up';
    }

    return sort.direction === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  trackByFacultyId(
    _: number,
    row: FacultyWorkloadCoverageFacultyResponse,
  ): string {
    return row.facultyId;
  }

  semesterLabel(semester: string | null | undefined): string {
    const labels: Record<string, string> = {
      FIRST_SEMESTER: 'First Semester',
      SECOND_SEMESTER: 'Second Semester',
      SUMMER_SEMESTER: 'Summer Semester',
    };

    return semester ? labels[semester] ?? semester : '-';
  }

  numberValue(value: number | string | null | undefined): number {
    return Number(value ?? 0) || 0;
  }

  private uniqueOptions(
    key: 'college' | 'position',
  ): string[] {
    return Array.from(
      new Set(
        this.baseRows()
          .map((row) => row[key]?.trim())
          .filter((value): value is string => !!value),
      ),
    ).sort((left, right) => left.localeCompare(right));
  }

  private matchesPreparationFilter(
    row: FacultyWorkloadCoverageFacultyResponse,
    filter: PreparationFilter,
  ): boolean {
    const preparations = row.numberOfPreparations;

    switch (filter) {
      case 'none':
        return preparations === null || preparations === undefined;
      case 'one':
        return preparations === 1;
      case 'two':
        return preparations === 2;
      case 'three-plus':
        return (preparations ?? 0) >= 3;
      default:
        return true;
    }
  }

  private compareRows(
    left: FacultyWorkloadCoverageFacultyResponse,
    right: FacultyWorkloadCoverageFacultyResponse,
    column: SortColumn,
  ): number {
    const leftValue = this.sortValue(left, column);
    const rightValue = this.sortValue(right, column);

    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return leftValue - rightValue;
    }

    return String(leftValue).localeCompare(String(rightValue), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  private sortValue(
    row: FacultyWorkloadCoverageFacultyResponse,
    column: SortColumn,
  ): string | number {
    switch (column) {
      case 'loadLimit':
        return this.numberValue(row.loadLimit);
      case 'workloadCount':
        return this.numberValue(row.workloadCount);
      case 'totalHoursPerWeek':
        return this.numberValue(row.totalHoursPerWeek);
      case 'numberOfPreparations':
        return this.numberValue(row.numberOfPreparations);
      default:
        return row[column]?.toString().trim() || '';
    }
  }

  private resetPage(): void {
    this.pageIndex.set(0);
  }

  private ensureValidPage(): void {
    if (this.pageIndex() > this.totalPages() - 1) {
      this.goToPage(this.totalPages() - 1);
    }
  }
}
