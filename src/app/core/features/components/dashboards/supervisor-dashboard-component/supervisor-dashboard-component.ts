import {

  Component,

  inject,

  OnInit

} from '@angular/core';

import {

  AsyncPipe,

  CommonModule

} from '@angular/common';

import {

  debounceTime,

  distinctUntilChanged,

  filter,

  map,

  Subject,

  take

} from 'rxjs';

import {

  SupervisorDataFacade

} from '../../../../store/supervisor-data/supervisor-data.facade';

import {

  AuthFacade

} from '../../../../store/auth/auth.facade';

import {

  FacultyClass,

  FacultyLoadDTO

} from '../../../../services/supervisor-data/supervisor-data-service';

@Component({

  selector:
    'app-supervisor-dashboard-component',

  standalone: true,

  imports: [

    AsyncPipe,

    CommonModule

  ],

  templateUrl:
    './supervisor-dashboard-component.html',

  styleUrl:
    './supervisor-dashboard-component.css',

})
export class SupervisorDashboardComponent
  implements OnInit {

  private supervisorDataFacade =
    inject(SupervisorDataFacade);

  private authFacade =
    inject(AuthFacade);

  /* ================= CONFIG ================= */

  readonly pageSize = 10;

  readonly status = 'ACTIVE';

  readonly program =
    sessionStorage.getItem('program') ?? '';

  readonly key =
    `${this.program}-${this.status}`;

  currentPage = 0;

  search = '';

  selectedFaculty:
    FacultyLoadDTO | null = null;

  /* ================= SEARCH ================= */

  private searchSubject =
    new Subject<string>();

  /* ================= OBSERVABLES ================= */

  evaluatorId$ =
    this.authFacade.evaluatorId$;

  faculties$ =
    this.supervisorDataFacade
      .faculties$(this.key);

  loading$ =
    this.supervisorDataFacade
      .facultiesLoading$(this.key);

  error$ =
    this.supervisorDataFacade
      .facultiesError$(this.key);

  pagination$ =
    this.supervisorDataFacade
      .facultyPagination$(this.key);

  facultyClasses$ =
    this.supervisorDataFacade
      .facultyClasses$(this.key);

  totalFaculty$ =
    this.pagination$.pipe(
      map(p => p.totalElements)
    );

  totalPages$ =
    this.pagination$.pipe(
      map(p => p.totalPages)
    );

  /* ================= INIT ================= */

  ngOnInit(): void {

    this.evaluatorId$
      .pipe(

        filter(Boolean),

        take(1)

      )
      .subscribe(userId => {

        this.loadFaculties(
          Number(userId)
        );

      });

    this.initializeSearch();

  }

  /* ================= SEARCH ================= */

  initializeSearch(): void {

    this.searchSubject
      .pipe(

        map(value =>
          value.trim()
        ),

        debounceTime(300),

        distinctUntilChanged()

      )
      .subscribe(value => {

        this.search = value.toLowerCase();

        this.currentPage = 0;

        this.reload();

      });

  }

  onSearch(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement)
        ?.value ?? '';

    this.searchSubject.next(value);

  }

  /* ================= LOAD ================= */

  loadFaculties(
    userId: number
  ): void {

    this.supervisorDataFacade
      .loadFaculties(

        this.key,

        this.program,

        userId,

        this.currentPage,

        this.pageSize,

        'lastname,asc',

        this.search

      );

  }

  reload(): void {

    this.evaluatorId$
      .pipe(take(1))
      .subscribe(userId => {

        if (!userId) {
          return;
        }

        this.loadFaculties(
          Number(userId)
        );

      });

  }

  /* ================= PAGINATION ================= */

  nextPage(
    totalPages: number
  ): void {

    if (
      this.currentPage + 1 >= totalPages
    ) {
      return;
    }

    this.currentPage++;

    this.reload();

  }

  previousPage(): void {

    if (this.currentPage <= 0) {
      return;
    }

    this.currentPage--;

    this.reload();

  }

  goToPage(
    page: number
  ): void {

    this.currentPage = page;

    this.reload();

  }

  getPageNumbers(
    totalPages: number
  ): number[] {

    return Array.from(
      { length: totalPages },
      (_, i) => i
    );

  }

  /* ================= FACULTY ================= */

  openFaculty(
    faculty: FacultyLoadDTO
  ): void {

    this.selectedFaculty = faculty;

    this.supervisorDataFacade
      .loadFacultyClasses(

        this.key,

        faculty.facultyId,

        this.program

      );

  }

  closeFacultyModal(): void {

    this.selectedFaculty = null;

  }

  /* ================= EVALUATION ================= */

  startEvaluation(

    cls: FacultyClass,

    faculty: FacultyLoadDTO

  ): void {

    const facultyName =
      `${faculty.firstname} ${faculty.lastname}`;

    this.supervisorDataFacade
      .selectClass({

        ...cls,

        facultyId:
          faculty.facultyId,

        facultyName

      });

  }

  /* ================= HELPERS ================= */

  schoolYear(): number {

    return new Date()
      .getFullYear();

  }

  semester(): string {

    return '2nd';

  }

  getFacultyInitials(
    faculty: FacultyLoadDTO
  ): string {

    const first =
      faculty.firstname?.charAt(0) ?? '';

    const last =
      faculty.lastname?.charAt(0) ?? '';

    return `${first}${last}`;

  }

  trackFaculty(
    _: number,
    faculty: FacultyLoadDTO
  ): string {

    return faculty.facultyId;

  }

  trackClass(
    _: number,
    cls: FacultyClass
  ): string {

    return cls.classCode;

  }

  /* ================= AUTH ================= */

  logout(): void {

    this.authFacade.logout();

  }

}