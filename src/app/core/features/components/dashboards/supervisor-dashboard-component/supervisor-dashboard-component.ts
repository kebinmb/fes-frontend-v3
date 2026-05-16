import { Component, inject } from '@angular/core';

import {
  AsyncPipe,
  CommonModule,
} from '@angular/common';

import {
  combineLatest,
  map,
  Observable,
  shareReplay,
} from 'rxjs';

import {
  FacultyDashboardVM,
  SupervisorDataFacade,
} from '../../../../store/supervisor-data/supervisor-data.facade';

import { AuthFacade } from '../../../../store/auth/auth.facade';

import {
  FacultyDTO,
  FacultyClass,
  FacultyLoadDTO,
} from '../../../../services/supervisor-data/supervisor-data-service';

type ClassVM = {
  subjectCode?: string;
  programCode?: string;
  yearLevel?: string;
  sectionCode?: string;
  isEvaluated: boolean;
};

@Component({
  selector: 'app-supervisor-dashboard-component',

  standalone: true,

  imports: [
    AsyncPipe,
    CommonModule,
  ],

  templateUrl:
    './supervisor-dashboard-component.html',

  styleUrl:
    './supervisor-dashboard-component.css',
})
export class SupervisorDashboardComponent {

  private supervisorDataFacade =
    inject(SupervisorDataFacade);

  private authFacade =
    inject(AuthFacade);

  program =
    sessionStorage.getItem(
      'program',
    ) ?? '';

  status = 'ACTIVE';

  key =
    `${this.program}-${this.status}`;

  currentPage = 1;

  readonly pageSize = 6;

  faculties$ =
    this.supervisorDataFacade
      .faculties$(this.key)
      .pipe(
        shareReplay(1),
      );

  facultiesLoading$ =
    this.supervisorDataFacade
      .facultiesLoading$(this.key)
      .pipe(
        shareReplay(1),
      );

  evaluatorId$ =
    this.authFacade.evaluatorId$;

  facultyDashboard$:
    Observable<
      FacultyDashboardVM[]
    > =
    this.supervisorDataFacade
      .facultyDashboard$(
        this.key,
      )
      .pipe(
        shareReplay(1),
      );

  loaded$ = combineLatest([
    this.faculties$,
    this.facultiesLoading$,
  ]).pipe(
    map(
      ([
        faculties,
        loading,
      ]) =>
        !loading &&
        faculties.length >= 0,
    ),
    shareReplay(1),
  );

  collegeFaculties$ =
    this.faculties$;

  totalClassesCount$ =
    this.facultyDashboard$.pipe(
      map((list) =>
        list.reduce(
          (
            sum,
            faculty,
          ) =>
            sum +
            faculty.classes.length,
          0,
        ),
      ),
      shareReplay(1),
    );

  completedEvaluationsCount$ =
    this.facultyDashboard$.pipe(
      map((list) =>
        list.reduce(
          (
            sum,
            faculty,
          ) =>
            sum +
            faculty.classes.filter(
              (
                cls,
              ) =>
                cls.isEvaluated,
            ).length,
          0,
        ),
      ),
      shareReplay(1),
    );

  isLoading$ =
    this.facultiesLoading$;

  pendingCount$ =
    combineLatest([
      this.totalClassesCount$,
      this
        .completedEvaluationsCount$,
    ]).pipe(
      map(
        ([
          total = 0,
          completed = 0,
        ]) =>
          total - completed,
      ),
      shareReplay(1),
    );

  totalPages$ =
    this.facultyDashboard$.pipe(
      map((list) =>
        Math.max(
          1,
          Math.ceil(
            list.length /
            this.pageSize,
          ),
        ),
      ),
      shareReplay(1),
    );

  paginatedFacultyDashboard$:
    Observable<
      FacultyDashboardVM[]
    > =
    this.facultyDashboard$.pipe(
      map((list) => {

        const start =
          (this.currentPage - 1) *
          this.pageSize;

        const end =
          start + this.pageSize;

        return list.slice(
          start,
          end,
        );
      }),
      shareReplay(1),
    );

  ngOnInit(): void {

    this.supervisorDataFacade.loadFaculties(
      this.key,
      this.program,
    );
  }

  refreshPagination(): void {

    this.paginatedFacultyDashboard$ =
      this.facultyDashboard$.pipe(
        map((list) => {

          const start =
            (this.currentPage - 1) *
            this.pageSize;

          const end =
            start + this.pageSize;

          return list.slice(
            start,
            end,
          );
        }),
        shareReplay(1),
      );
  }

  nextPage(
    totalPages: number,
  ): void {

    if (
      this.currentPage <
      totalPages
    ) {

      this.currentPage++;

      this.refreshPagination();
    }
  }

  previousPage(): void {

    if (
      this.currentPage > 1
    ) {

      this.currentPage--;

      this.refreshPagination();
    }
  }

  goToPage(
    page: number,
  ): void {

    this.currentPage = page;

    this.refreshPagination();
  }

  getPageNumbers(
    totalPages: number,
  ): number[] {

    return Array.from(
      {
        length:
          totalPages,
      },
      (_, index) =>
        index + 1,
    );
  }

  schoolYear(): number {

    return new Date().getFullYear();
  }

  semester(): string {

    return '2nd';
  }

  getFacultyInitials(
    faculty: FacultyLoadDTO,
  ): string {

    const first =
      faculty.firstname?.charAt(
        0,
      ) ?? '';

    const last =
      faculty.lastname?.charAt(
        0,
      ) ?? '';

    return `${first}${last}`;
  }

  onFacultyClick(
    faculty: FacultyLoadDTO,
  ): void {

    console.log(
      'Faculty clicked:',
      faculty,
    );
  }

  startEvaluation(
    cls: FacultyClass,
    faculty: FacultyLoadDTO,
    event: Event,
  ): void {

    event.stopPropagation();

    const key =
      `${faculty.facultyId}-${cls.classCode}-${cls.semester}-${cls.schoolYear}`;

    const facultyName =
      `${faculty.firstname} ${faculty.lastname}`;

    this.supervisorDataFacade.selectClass({
      ...cls,
      facultyId:
        faculty.facultyId,
      facultyName,
    });

    console.log(
      'Evaluate:',
      {
        key,
        cls,
        faculty,
      },
    );
  }

  getButtonLabel(
    cls: ClassVM,
  ): string {

    if (
      cls.isEvaluated
    ) {

      return 'Done';
    }

    const parts = [
      cls.subjectCode,
      cls.programCode,
    ].filter(Boolean);

    return `${parts.join(
      ' ',
    )} - Evaluate`;
  }

  logout(): void {

    this.authFacade.logout();
  }
}