import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { forkJoin, Observable } from 'rxjs';
import { map, shareReplay, tap } from 'rxjs/operators';
import { FacultyEvaluationScore, Page } from '../evaluation/evaluation-service';
import { repairSpecialCharacters } from '@utilities/normalize-text';
export interface PageResponse<T> {
  content: T[];

  totalElements: number;

  totalPages: number;

  page: number;

  size: number;
}
export interface FetchFacultyResponse {
  facultyId: string;
  firstname: string;
  lastname: string;
  middlename: string;
  position: string;
  loadLimit: string;
  status: string;
  college: string;
  legacyDatabase?: string;
}
export interface FetchUserAccountsResponse {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: string;
  college: string;
  programs: string;
  majors: string;
}
export interface FetchFacultyEvaluationScoreResponse {
  facultyEvaluationScoreId: number;
  facultyId: string;
  facultyName: string;
  evaluatorId: string;
  classCode: string;
  college: string;
  position: string;
  semester: string;
  schoolYear: number;
  subjectCode: string;
  yearLevel: string;
  commentsOrFeedbacks: string;
  overallAverageScore: number;
  overallInterpretation: string;
}

export interface UpdateFacultyRequest {
  facultyId: string;
  firstname: string;
  middlename?: string;
  lastname: string;
  position: string;
  loadLimit: number;
  college: string;
  status: string;
}
export interface CreateUserAccountRequest {
  username: string;
  email: string;
  password: string;
  role: string;
  college?: string;
  programs?: string;
  majors?: string;
  status: string;
}

export interface UpdateUserAccountRequest {
  userId: number;
  username: string;
  email: string;
  role: string;
  college?: string;
  programs?: string;
  majors?: string;
  status: string;
  isEnabled: boolean;
  isLocked: boolean;
}

export interface UpdateUserPasswordRequest {
  userId: number;
  newPassword: string;
}
export interface MigrationErrorResponse {
  entity?: string;
  message?: string;
}

export interface MigrationStatistics {
  totalRecords?: number;
  successfulRecords?: number;
  failedRecords?: number;
}

export interface MigrationResponse<T> {
  status: string;
  message: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  stats: MigrationStatistics | null;
  errors: MigrationErrorResponse[];
  data?: T;
}
export type Semester =
  | 'FIRST_SEMESTER'
  | 'SECOND_SEMESTER'
  | 'SUMMER_SEMESTER';

export interface SchoolYearAndSemesterResponse {
  id: number;
  schoolYear: number;
  semester: string;
  status: string;
  createdAt: string;
}

export interface CurrentSchoolYearAndSemesterResponse {
  id: number;
  schoolYear: number;
  semester: string;
  status: string;
  createdAt: string;
}

export interface StudentFacultyEvaluationDTO {

  studentId: string;

  studentFirstname: string;

  studentLastname: string;

  classCode: string;

  programCode: string;

  sectionCode: string;

  facultyId: string;

  facultyFirstname: string;

  facultyLastname: string;

  createdAt: string;
}

export interface StudentSectionEvaluationDTO {

  programCode: string;

  yearLevel: string;

  sectionCode: string;

  totalStudents: number;

  evaluatedStudents: number;

  notYetEvaluated: number;
}
export interface StudentEvaluationStatusResponse {

  studentId: string;

  programCode: string;

  yearLevel: string;

  sectionCode: string;

  subjectCode: string;

  createdAt: string;

  evaluationStatus: string;
}

export interface AdminDashboardSummaryResponse {
  schoolYear: number;
  semester: string;
  totalStudents: number;
  totalFaculty: number;
  totalClasses: number;
  totalSubjects: number;
  totalPrograms: number;
  totalSections: number;
  expectedEvaluations: number;
  completedEvaluations: number;
  evaluatedStudents: number;
  pendingEvaluations: number;
  evaluationCompletionRate: number;
  averageOverallScore: number;
}

export interface AdminDashboardProgramBreakdownResponse {
  programCode: string;
  totalStudents: number;
  totalClasses: number;
  totalSections: number;
  expectedEvaluations: number;
  completedEvaluations: number;
  completionRate: number;
  averageOverallScore: number;
}

export interface AdminDashboardFacultyLoadResponse {
  facultyId: string;
  facultyName: string;
  totalClasses: number;
  totalSubjects: number;
  totalStudents: number;
  completedEvaluations: number;
  averageOverallScore: number;
}

export interface AdminDashboardResponse {
  summary: AdminDashboardSummaryResponse;
  programs: AdminDashboardProgramBreakdownResponse[];
  facultyLoads: AdminDashboardFacultyLoadResponse[];
}
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly ADMIN_API_URL = `${environment.API_URL}/admin`;
  private readonly MIGRATION_API_URL = `${environment.API_URL}/migration/all`;
  private readonly DASHBOARD_CACHE_TTL_MS = 30_000;
  private readonly DASHBOARD_FACULTY_LOAD_LIMIT = 50;
  private readonly CURRENT_TERM_CACHE_TTL_MS = 5 * 60_000;
  private dashboardCache$?: Observable<AdminDashboardResponse>;
  private dashboardCacheCreatedAt = 0;
  private currentTermCache$?: Observable<CurrentSchoolYearAndSemesterResponse>;
  private currentTermCacheCreatedAt = 0;

  getDashboard(forceRefresh = false): Observable<AdminDashboardResponse> {
    const isExpired =
      Date.now() - this.dashboardCacheCreatedAt > this.DASHBOARD_CACHE_TTL_MS;

    if (forceRefresh || !this.dashboardCache$ || isExpired) {
      this.dashboardCacheCreatedAt = Date.now();
      this.dashboardCache$ = forkJoin({
        summary: this.getDashboardSummary(),
        programs: this.getDashboardProgramBreakdown(),
        facultyLoads: this.getDashboardFacultyLoads(this.DASHBOARD_FACULTY_LOAD_LIMIT),
      }).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }

    return this.dashboardCache$;
  }

  getDashboardSummary(): Observable<AdminDashboardSummaryResponse> {
    return this.http.get<AdminDashboardSummaryResponse>(`${this.ADMIN_API_URL}/dashboard/summary`, {
      withCredentials: true,
    });
  }

  getDashboardProgramBreakdown(): Observable<AdminDashboardProgramBreakdownResponse[]> {
    return this.http.get<AdminDashboardProgramBreakdownResponse[]>(
      `${this.ADMIN_API_URL}/dashboard/programs`,
      { withCredentials: true },
    );
  }

  getDashboardFacultyLoads(limit = 10): Observable<AdminDashboardFacultyLoadResponse[]> {
    const params = new HttpParams().set('limit', limit);

    return this.http.get<AdminDashboardFacultyLoadResponse[]>(
      `${this.ADMIN_API_URL}/dashboard/faculty-loads`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  clearDashboardCache(): void {
    this.dashboardCache$ = undefined;
    this.dashboardCacheCreatedAt = 0;
  }

  getFaculties(
    page: number = 0,
    size: number = 10,
    search: string = '',
    legacyDatabase: string = '',
  ): Observable<PageResponse<FetchFacultyResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (search.trim()) {
      params = params.set('search', search);
    }

    if (legacyDatabase.trim()) {
      params = params.set('legacyDatabase', legacyDatabase.trim());
    }

    return this.http.get<PageResponse<FetchFacultyResponse>>(`${this.ADMIN_API_URL}/faculties`, {
      params,
      withCredentials: true,
    }).pipe(map((response) => repairSpecialCharacters(response)));
  }

  getUserAccounts(
    page: number = 0,
    size: number = 10,
  ): Observable<PageResponse<FetchUserAccountsResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http.get<PageResponse<FetchUserAccountsResponse>>(
      `${this.ADMIN_API_URL}/user-accounts`,
      { params, withCredentials: true },
    );
  }

  getFacultyEvaluationScores(
    page: number = 0,
    size: number = 10,
  ): Observable<PageResponse<FetchFacultyEvaluationScoreResponse>> {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http.get<PageResponse<FetchFacultyEvaluationScoreResponse>>(
      `${this.ADMIN_API_URL}/faculty-evaluation-score`,
      { params, withCredentials: true },
    );
  }

  updateFaculty(payload: UpdateFacultyRequest): Observable<string> {
    const params = new HttpParams()
      .set('facultyId', payload.facultyId)
      .set('firstname', payload.firstname)
      .set('middlename', payload.middlename ?? '')
      .set('lastname', payload.lastname)
      .set('position', payload.position)
      .set('loadLimit', payload.loadLimit)
      .set('college', payload.college)
      .set('status', payload.status);

    return this.http.put(
      `${this.ADMIN_API_URL}/update-faculty`,
      {},
      {
        params,
        responseType: 'text',
        withCredentials: true,
      },
    ).pipe(
      tap(() => {
        this.clearDashboardCache();
      }),
    );
  }

  getFacultyEvaluationScoresByFacultyId(
    facultyId: string
  ): Observable<FacultyEvaluationScore[]> {

    return this.http.get<FacultyEvaluationScore[]>(
      `${this.ADMIN_API_URL}/faculty-evaluation-score/${encodeURIComponent(facultyId)}`,
      {
        withCredentials: true,
      },
    );
  }

  migrateAll(): Observable<MigrationResponse<void>> {
    return this.http.post<MigrationResponse<void>>(
      `${this.MIGRATION_API_URL}`,
      {},
      {
        withCredentials: true,
      },
    );
  }
  updateSchoolYearAndSemester(
    schoolYear: number,
    semester: Semester,
  ): Observable<SchoolYearAndSemesterResponse> {

    const params = new HttpParams()

      .set(
        'schoolYear',
        schoolYear,
      )

      .set(
        'semester',
        semester,
      );

    return this.http.put<SchoolYearAndSemesterResponse>(
      `${this.ADMIN_API_URL}/school-year-semester`,
      {},
      {
        params,
        withCredentials: true,
      },
    ).pipe(
      tap(() => {
        this.clearDashboardCache();
        this.clearCurrentTermCache();
      }),
    );
  }

  fetchCurrentSchoolYearAndSemester():
    Observable<CurrentSchoolYearAndSemesterResponse> {
    const isExpired =
      Date.now() - this.currentTermCacheCreatedAt >
      this.CURRENT_TERM_CACHE_TTL_MS;

    if (!this.currentTermCache$ || isExpired) {
      this.currentTermCacheCreatedAt = Date.now();
      this.currentTermCache$ = this.http.get<
        CurrentSchoolYearAndSemesterResponse
      >(
        `${this.ADMIN_API_URL}/school-year-semester`,
        {
          withCredentials: true,
        },
      ).pipe(shareReplay({ bufferSize: 1, refCount: false }));
    }

    return this.currentTermCache$;
  }

  clearCurrentTermCache(): void {
    this.currentTermCache$ = undefined;
    this.currentTermCacheCreatedAt = 0;
  }

  getStudentEvaluations(
    page: number = 0,
    size: number = 10,
    search: string = '',
    sortBy: string = 'created_at',
    sortDirection: 'asc' | 'desc' = 'desc',
  ): Observable<Page<StudentFacultyEvaluationDTO>> {

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('search', search)
      .set('sortBy', sortBy)
      .set('sortDirection', sortDirection);

    return this.http.get<Page<StudentFacultyEvaluationDTO>>(
      `${this.ADMIN_API_URL}/student-faculty-evaluation`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  createUserAccount(
    payload: CreateUserAccountRequest,
  ): Observable<string> {

    return this.http.post(
      `${this.ADMIN_API_URL}/create-user`,
      payload,
      {
        responseType: 'text',
        withCredentials: true,
      },
    );
  }
  updateUserAccount(
    payload: UpdateUserAccountRequest,
  ): Observable<string> {

    return this.http.put(
      `${this.ADMIN_API_URL}/update-user`,
      payload,
      {
        responseType: 'text',
        withCredentials: true,
      },
    );
  }
  updateUserPassword(
    payload: UpdateUserPasswordRequest,
  ): Observable<string> {

    return this.http.put(
      `${this.ADMIN_API_URL}/update-password`,
      payload,
      {
        responseType: 'text',
        withCredentials: true,
      },
    );
  }

  getStudentSections(
    page: number = 0,
    size: number = 10,
    programCode?: string,
    yearLevel?: string,
    sectionCode?: string,
  ): Observable<PageResponse<StudentSectionEvaluationDTO>> {

    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (programCode?.trim()) {

      params = params.set(
        'programCode',
        programCode,
      );
    }

    if (yearLevel?.trim()) {

      params = params.set(
        'yearLevel',
        yearLevel,
      );
    }

    if (sectionCode?.trim()) {

      params = params.set(
        'sectionCode',
        sectionCode,
      );
    }

    return this.http.get<
      PageResponse<StudentSectionEvaluationDTO>
    >(
      `${this.ADMIN_API_URL}/student-sections`,
      {
        params,
        withCredentials: true,
      },
    );
  }
  getStudentEvaluationStatus(

  programCode: string,

  yearLevel: string,

  sectionCode: string,

): Observable<StudentEvaluationStatusResponse[]> {

  const params = new HttpParams()

    .set(
      'programCode',
      programCode,
    )

    .set(
      'yearLevel',
      yearLevel,
    )

    .set(
      'sectionCode',
      sectionCode,
    );

  return this.http.get<
    StudentEvaluationStatusResponse[]
  >(
    `${this.ADMIN_API_URL}/student-evaluation-status`,
    {
      params,
      withCredentials: true,
    },
  );
}
}


