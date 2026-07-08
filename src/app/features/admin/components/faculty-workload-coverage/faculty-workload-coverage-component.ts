import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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

@Component({
  selector: 'app-faculty-workload-coverage-component',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, UnicodeTextPipe],
  templateUrl: './faculty-workload-coverage-component.html',
  styleUrl: './faculty-workload-coverage-component.css',
})
export class FacultyWorkloadCoverageComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);

  coverage = signal<FacultyWorkloadCoverageResponse | null>(null);
  activeTab = signal<CoverageTab>('without');
  searchTerm = signal('');
  isLoading = signal(false);
  isRefreshing = signal(false);

  activeRows = computed(() => {
    const data = this.coverage();
    const rows = this.activeTab() === 'without'
      ? data?.withoutWorkload ?? []
      : data?.withWorkload ?? [];
    const search = this.searchTerm().trim().toLowerCase();

    if (!search) {
      return rows;
    }

    return rows.filter((row) =>
      [
        row.facultyId,
        row.facultyName,
        row.college,
        row.position,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(search),
    );
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
        finalize(() => {
          this.isLoading.set(false);
          this.isRefreshing.set(false);
        }),
      )
      .subscribe({
        next: (response) => this.coverage.set(response),
        error: (error) => {
          this.coverage.set(null);
          this.toastFacade.showToast(extractErrorMessage(error), 'error');
        },
      });
  }

  setActiveTab(tab: CoverageTab): void {
    this.activeTab.set(tab);
  }

  updateSearchTerm(value: string): void {
    this.searchTerm.set(value);
  }

  clearSearch(): void {
    this.searchTerm.set('');
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
}
