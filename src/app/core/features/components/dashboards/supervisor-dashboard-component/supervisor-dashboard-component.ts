import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  inject
} from '@angular/core';

import {
  AsyncPipe,
  CommonModule
} from '@angular/common';

import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  take
} from 'rxjs';

import {
  takeUntilDestroyed
} from '@angular/core/rxjs-interop';

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

import {
  ConfirmationModalComponent
} from '../../../../../shared/components/confirmation-modal-component/confirmation-modal-component';

@Component({
  selector:
    'app-supervisor-dashboard-component',

  standalone: true,

  imports: [
    AsyncPipe,
    CommonModule,
    ConfirmationModalComponent
  ],

  templateUrl:
    './supervisor-dashboard-component.html',

  styleUrl:
    './supervisor-dashboard-component.css'
})
export class SupervisorDashboardComponent
  implements OnInit, AfterViewInit {
  isConfirmationVisible = false;
  pendingFaculty:
    FacultyLoadDTO | null = null;
  /* =========================================================
   * DEPENDENCIES
   * =======================================================*/

  private readonly supervisorDataFacade =
    inject(SupervisorDataFacade);

  private readonly authFacade =
    inject(AuthFacade);

  private readonly destroyRef =
    inject(DestroyRef);

  /* =========================================================
   * VIEWCHILD
   * =======================================================*/

  @ViewChild('confirmationModal')
  confirmationModal!: ConfirmationModalComponent;

  /* =========================================================
   * CONFIG
   * =======================================================*/

  readonly pageSize = 10;

  readonly status = 'ACTIVE';

  readonly program =
    sessionStorage.getItem('program') ?? '';

  readonly key =
    `${this.program}-${this.status}`;

  /* =========================================================
   * STATE
   * =======================================================*/

  currentPage = 0;

  search = '';

  selectedFaculty:
    FacultyLoadDTO | null = null;

  selectedClass:
    FacultyClass | null = null;

  /* =========================================================
   * SEARCH
   * =======================================================*/

  private readonly searchSubject =
    new Subject<string>();

  /* =========================================================
   * OBSERVABLES
   * =======================================================*/

  readonly evaluatorId$ =
    this.authFacade.evaluatorId$;

  readonly faculties$ =
    this.supervisorDataFacade
      .faculties$(this.key);

  readonly loading$ =
    this.supervisorDataFacade
      .facultiesLoading$(this.key);

  readonly error$ =
    this.supervisorDataFacade
      .facultiesError$(this.key);

  readonly pagination$ =
    this.supervisorDataFacade
      .facultyPagination$(this.key);

  readonly facultyClasses$ =
    this.supervisorDataFacade
      .facultyClasses$(this.key);

  readonly totalFaculty$ =
    this.pagination$.pipe(
      map(pagination =>
        pagination.totalElements
      )
    );

  readonly totalPages$ =
    this.pagination$.pipe(
      map(pagination =>
        pagination.totalPages
      )
    );

  /* =========================================================
   * LIFECYCLE
   * =======================================================*/

  ngOnInit(): void {

    this.initializeSearch();

    this.initializeFacultyLoad();

  }

  ngAfterViewInit(): void { }

  /* =========================================================
   * INITIALIZATION
   * =======================================================*/

  private initializeFacultyLoad(): void {

    this.evaluatorId$
      .pipe(

        filter(Boolean),

        take(1),

        takeUntilDestroyed(
          this.destroyRef
        )

      )
      .subscribe(userId => {

        this.loadFaculties(
          Number(userId)
        );

      });

  }

  private initializeSearch(): void {

    this.searchSubject
      .pipe(

        map(value =>
          value.trim()
        ),

        debounceTime(300),

        distinctUntilChanged(),

        takeUntilDestroyed(
          this.destroyRef
        )

      )
      .subscribe(search => {

        this.search =
          search.toLowerCase();

        this.currentPage = 0;

        this.reload();

      });

  }

  /* =========================================================
   * SEARCH
   * =======================================================*/

  onSearch(
    event: Event
  ): void {

    const value =
      (event.target as HTMLInputElement)
        ?.value ?? '';

    this.searchSubject.next(value);

  }

  /* =========================================================
   * LOAD
   * =======================================================*/

  private loadFaculties(
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
      .pipe(

        take(1),

        takeUntilDestroyed(
          this.destroyRef
        )

      )
      .subscribe(userId => {

        if (!userId) {
          return;
        }

        this.loadFaculties(
          Number(userId)
        );

      });

  }

  /* =========================================================
   * PAGINATION
   * =======================================================*/

  nextPage(
    totalPages: number
  ): void {

    if (
      this.currentPage + 1 >=
      totalPages
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

    if (page === this.currentPage) {
      return;
    }

    this.currentPage = page;

    this.reload();

  }

  getPageNumbers(
    totalPages: number
  ): number[] {

    return Array.from(
      { length: totalPages },
      (_, index) => index
    );

  }

  /* =========================================================
   * FACULTY
   * =======================================================*/

  openFaculty(
    faculty: FacultyLoadDTO
  ): void {

    this.selectedFaculty =
      faculty;

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

  /* =========================================================
   * CONFIRMATION MODAL
   * =======================================================*/

  openFacultyConfirmation(
    faculty: FacultyLoadDTO
  ): void {

    this.pendingFaculty =
      faculty;

    this.isConfirmationVisible =
      true;

  }
  confirmFacultyEvaluation(): void {

    if (!this.pendingFaculty) {
      return;
    }

    this.isConfirmationVisible =
      false;

    this.openFaculty(
      this.pendingFaculty
    );

  }
  closeFacultyConfirmation(): void {

    this.isConfirmationVisible =
      false;

    this.pendingFaculty = null;

  }

  confirmEvaluation(): void {

    this.isConfirmationVisible = false;

    if (
      !this.selectedClass ||
      !this.selectedFaculty
    ) {
      return;
    }

    this.startEvaluation(
      this.selectedClass,
      this.selectedFaculty
    );
  }

  /* =========================================================
   * EVALUATION
   * =======================================================*/

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

  /* =========================================================
   * HELPERS
   * =======================================================*/

  getCampusName(
    campus: string
  ): string {

    const campusMap:
      Record<string, string> = {

      LEGACY_FT:
        'Fortune Towne Campus',

      LEGACY_ALIJIS:
        'Alijis Campus',

      LEGACY_BINALBAGAN:
        'Binalbagan Campus',

      LEGACY_TALISAY:
        'Talisay Campus'

    };

    return (
      campusMap[campus] ||
      campus
    );

  }

  getFacultyInitials(
    faculty: FacultyLoadDTO
  ): string {

    const first =
      faculty.firstname
        ?.charAt(0) ?? '';

    const last =
      faculty.lastname
        ?.charAt(0) ?? '';

    return `${first}${last}`;

  }

  schoolYear(): number {

    return new Date()
      .getFullYear();

  }

  semester(): string {

    return '2nd';

  }

  /* =========================================================
   * TRACKBY
   * =======================================================*/

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

  /* =========================================================
   * AUTH
   * =======================================================*/

  logout(): void {

    this.authFacade.logout();

  }

}