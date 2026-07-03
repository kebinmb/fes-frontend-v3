import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, finalize, of } from 'rxjs';
import {
  AdminDashboardFacultyLoadResponse,
  AdminDashboardProgramBreakdownResponse,
  AdminDashboardResponse,
  AdminService,
} from '@core/services/admin/admin-service';
import { ToastFacade } from '@core/store/toast/toast.facade';
import { extractErrorMessage } from '@utilities/extract-error.util';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';

interface MetricCard {
  label: string;
  value: string;
  detail: string;
  icon: string;
  tone: 'green' | 'blue' | 'gold' | 'red';
  route: string;
}

interface DashboardViewModel {
  metrics: MetricCard[];
  termLabel: string;
  summary: AdminDashboardResponse['summary'];
  programs: AdminDashboardProgramBreakdownResponse[];
  facultyLoads: AdminDashboardFacultyLoadResponse[];
}

@Component({
  selector: 'app-admin-dashboard-overview-component',
  standalone: true,
  imports: [CommonModule, RouterLink, UnicodeTextPipe],
  templateUrl: './admin-dashboard-overview-component.html',
  styleUrl: './admin-dashboard-overview-component.css',
})
export class AdminDashboardOverviewComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastFacade = inject(ToastFacade);

  readonly pageSize = 5;
  readonly metricSkeletonItems = [1, 2, 3, 4];
  readonly panelSkeletonItems = [1, 2, 3];
  readonly rowSkeletonItems = [1, 2, 3, 4, 5];
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly dashboard = signal<DashboardViewModel | null>(null);
  readonly isInitialLoading = computed(() => this.isLoading() && !this.dashboard());
  readonly isRefreshing = computed(() => this.isLoading() && Boolean(this.dashboard()));
  readonly programPage = signal(1);
  readonly facultyLoadPage = signal(1);
  readonly paginatedPrograms = computed(() =>
    this.paginate(this.dashboard()?.programs ?? [], this.programPage()),
  );
  readonly paginatedFacultyLoads = computed(() =>
    this.paginate(this.dashboard()?.facultyLoads ?? [], this.facultyLoadPage()),
  );
  readonly programTotalPages = computed(() => this.getTotalPages(this.dashboard()?.programs.length ?? 0));
  readonly facultyLoadTotalPages = computed(() =>
    this.getTotalPages(this.dashboard()?.facultyLoads.length ?? 0),
  );
  readonly programPaginationLabel = computed(() =>
    this.getPaginationLabel(this.dashboard()?.programs.length ?? 0, this.programPage()),
  );
  readonly facultyLoadPaginationLabel = computed(() =>
    this.getPaginationLabel(this.dashboard()?.facultyLoads.length ?? 0, this.facultyLoadPage()),
  );

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(forceRefresh = false): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.adminService
      .getDashboard(forceRefresh)
      .pipe(
        catchError((error) => {
          const message = extractErrorMessage(error);

          this.errorMessage.set(message);
          this.toastFacade.showToast(message, 'error');

          return of(null);
        }),
        finalize(() => {
          this.isLoading.set(false);
        }),
      )
      .subscribe((response) => {
        if (!response) {
          return;
        }

        this.dashboard.set(this.buildDashboardViewModel(response));
        this.resetPagination();
      });
  }

  trackMetric(_: number, metric: MetricCard): string {
    return metric.label;
  }

  trackProgram(_: number, item: AdminDashboardProgramBreakdownResponse): string {
    return item.programCode;
  }

  trackFacultyLoad(_: number, item: AdminDashboardFacultyLoadResponse): string {
    return item.facultyId;
  }

  previousProgramPage(): void {
    this.programPage.update((page) => Math.max(1, page - 1));
  }

  nextProgramPage(): void {
    this.programPage.update((page) => Math.min(this.programTotalPages(), page + 1));
  }

  previousFacultyLoadPage(): void {
    this.facultyLoadPage.update((page) => Math.max(1, page - 1));
  }

  nextFacultyLoadPage(): void {
    this.facultyLoadPage.update((page) => Math.min(this.facultyLoadTotalPages(), page + 1));
  }

  formatSemester(semester: string | null | undefined): string {
    return semester
      ? semester
          .toLowerCase()
          .split('_')
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
          .join(' ')
      : 'Current Semester';
  }

  completionWidth(value: number | null | undefined): number {
    return Math.min(100, Math.max(0, this.formatPercent(value)));
  }

  private buildDashboardViewModel(response: AdminDashboardResponse): DashboardViewModel {
    const summary = response.summary;
    const completionRate = this.formatPercent(summary.evaluationCompletionRate);
    const averageOverallScore = this.formatScore(summary.averageOverallScore);

    return {
      metrics: [
        {
          label: 'Students',
          value: this.formatCount(summary.totalStudents),
          detail: `${summary.evaluatedStudents} students evaluated`,
          icon: 'bi-mortarboard-fill',
          tone: 'green',
          route: '/admin-dashboard/student-evaluation-list',
        },
        {
          label: 'Faculty',
          value: this.formatCount(summary.totalFaculty),
          detail: `${summary.totalClasses} classes handled`,
          icon: 'bi-person-workspace',
          tone: 'blue',
          route: '/admin-dashboard/faculty-list',
        },
        {
          label: 'Completion',
          value: `${completionRate}%`,
          detail: `${summary.completedEvaluations} of ${summary.expectedEvaluations} expected`,
          icon: 'bi-clipboard-check-fill',
          tone: 'gold',
          route: '/admin-dashboard/student-evaluations',
        },
        {
          label: 'Average Score',
          value: averageOverallScore || '-',
          detail: `${summary.totalPrograms} programs, ${summary.totalSections} sections`,
          icon: 'bi-graph-up-arrow',
          tone: 'red',
          route: '/admin-dashboard/evaluation-score-list',
        },
      ],
      termLabel: `${this.formatSemester(summary.semester)} - ${summary.schoolYear ?? 'Current Year'}`,
      summary,
      programs: response.programs ?? [],
      facultyLoads: response.facultyLoads ?? [],
    };
  }

  formatPercent(value: number | null | undefined): number {
    return Math.round(Number(value) || 0);
  }

  formatScore(value: number | null | undefined): string {
    const score = Number(value) || 0;

    return score ? score.toFixed(2) : '';
  }

  private formatCount(value: number | null | undefined): string {
    return Number(value || 0).toLocaleString();
  }

  private resetPagination(): void {
    this.programPage.set(1);
    this.facultyLoadPage.set(1);
  }

  private paginate<T>(items: T[], page: number): T[] {
    const start = (page - 1) * this.pageSize;

    return items.slice(start, start + this.pageSize);
  }

  private getTotalPages(totalItems: number): number {
    return Math.max(1, Math.ceil(totalItems / this.pageSize));
  }

  private getPaginationLabel(totalItems: number, currentPage: number): string {
    if (!totalItems) {
      return 'No records';
    }

    const start = (currentPage - 1) * this.pageSize + 1;
    const end = Math.min(totalItems, currentPage * this.pageSize);

    return `Showing ${start}-${end} of ${totalItems}`;
  }
}
