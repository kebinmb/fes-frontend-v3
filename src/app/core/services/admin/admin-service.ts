import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable, throwError } from 'rxjs';
import { catchError, map, shareReplay, switchMap, tap } from 'rxjs/operators';
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

export interface ClassFacultyAssignmentResponse {
  primaryClassId: number;
  classCode: string;
  subjectCode: string;
  subjectTitle: string | null;
  sectionId: number | null;
  programCode: string | null;
  yearLevel: string | null;
  sectionCode: string | null;
  facultyId: string | null;
  facultyName: string | null;
  schoolYear: number;
  semester: string;
  legacyDatabase: string | null;
  sourceCampus: string | null;
}

export interface FacultyAssignmentOptionResponse {
  facultyId: string;
  facultyName: string;
  position: string | null;
  college: string | null;
  legacyDatabase: string | null;
}

export interface ClassFacultyReassignmentResponse {
  assignment: ClassFacultyAssignmentResponse;
  previousFacultyId: string | null;
  newFacultyId: string;
  changed: boolean;
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

export interface FacultyEvaluationPrintResponse {
  facultyEvaluationScoreId: number;
  facultyId: string;
  facultyName?: string;
  evaluatorId?: string;
  evaluatorType?: string;
  classCode: string;
  numberOfStudents?: number;
  college: string;
  sectionCode?: string;
  programCode?: string;
  position: string;
  semester?: string;
  schoolYear?: number;
  subjectCode?: string;
  yearLevel?: string;
  overallAverageScore: number;
  overallInterpretation?: string;
  setRating?: number;
  sefRating?: number;
  studentComments?: string;
  supervisorComments?: string;
  supervisorName?: string;
  supervisorDesignation?: string;
  comments?: string;
}

export interface FacultyEvaluationGeneratedReportResponse {
  reportId: string;
  facultyId: string;
  facultyName?: string;
  schoolYear: number;
  semester: string;
  versionNumber: number;
  status: 'VALID' | 'SUPERSEDED' | 'REVOKED' | string;
  reportHash: string;
  verificationUrl: string;
  qrCodeDataUri: string;
  generatedByUserId?: number | null;
  generatedByUsername?: string | null;
  generatedAt: string;
  items: FacultyEvaluationPrintResponse[];
}

export interface FacultyEvaluationBulkReportResponse {
  requestedCount: number;
  generatedCount: number;
  skippedFacultyIds: string[];
  reports: FacultyEvaluationGeneratedReportResponse[];
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

export type FacultyWorkloadSource = 'MANUAL' | 'IMPORTED' | 'SYSTEM';
export type FacultyLoadStatus = 'Regular' | 'Overload';
export type FacultyWorkloadNumber = number | string | null;

export interface FacultyWorkloadRequest {
  facultyWorkloadId?: number | null;
  facultyId: string;
  schoolYear: number;
  semester: string;
  classCode?: string | null;
  courseCode: string;
  programCode: string;
  yearLevel: string;
  sectionCode: string;
  totalHoursPerWeek?: FacultyWorkloadNumber;
  totalTeachingLoad?: FacultyWorkloadNumber;
  numberOfPreparations?: number | null;
  designationEtu?: FacultyWorkloadNumber;
  totalWorkload?: FacultyWorkloadNumber;
  overloadHours?: FacultyWorkloadNumber;
  loadStatus?: FacultyLoadStatus;
  source?: FacultyWorkloadSource;
  remarks?: string | null;
}

export interface FacultyWorkloadResponse extends FacultyWorkloadRequest {
  facultyWorkloadId: number;
  facultyName: string;
  college?: string | null;
  loadLimit?: number | null;
  classCode?: string | null;
  courseCode: string;
  programCode: string;
  yearLevel: string;
  sectionCode: string;
  totalHoursPerWeek: FacultyWorkloadNumber;
  totalTeachingLoad: FacultyWorkloadNumber;
  numberOfPreparations: number | null;
  designationEtu: FacultyWorkloadNumber;
  totalWorkload: FacultyWorkloadNumber;
  overloadHours: FacultyWorkloadNumber;
  loadStatus: FacultyLoadStatus;
  source: FacultyWorkloadSource;
  remarks: string | null;
}

export interface FacultyWorkloadSectionOptionResponse {
  sectionId: number;
  programCode: string;
  yearLevel: string;
  sectionCode: string;
}

export interface FacultyWorkloadClassOptionResponse {
  classCode: string;
  courseCode: string;
  sectionId: number;
  programCode: string;
  yearLevel: string;
  sectionCode: string;
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

export interface FacultyWorkloadCoverageFacultyResponse {
  facultyId: string;
  facultyName: string;
  position?: string | null;
  college?: string | null;
  status?: string | null;
  loadLimit?: number | null;
  hasWorkload: boolean;
  workloadCount: number;
  totalHoursPerWeek: FacultyWorkloadNumber;
  numberOfPreparations?: number | null;
}

export interface FacultyWorkloadCoverageResponse {
  schoolYear: number;
  semester: string;
  totalActiveFaculty: number;
  withWorkloadCount: number;
  withoutWorkloadCount: number;
  coverageRate: number;
  withWorkload: FacultyWorkloadCoverageFacultyResponse[];
  withoutWorkload: FacultyWorkloadCoverageFacultyResponse[];
}

export type SupervisorEvaluationStatusFilter = 'ALL' | 'EVALUATED' | 'PENDING';

export interface SupervisorEvaluationDashboardResponse {
  facultyId: string;
  facultyName: string;
  position?: string | null;
  college?: string | null;
  legacyDatabase?: string | null;
  campus?: string | null;
  assignedClassCount: number;
  supervisorEvaluated: boolean;
  supervisorEvaluationCount: number;
  supervisorIds?: string | null;
  supervisorNames?: string | null;
  supervisorPositions?: string | null;
  supervisorAverageScore?: number | null;
  lastEvaluatedAt?: string | null;
  schoolYear: number;
  semester: string;
}

export interface SupervisorEvaluationDashboardPageResponse
  extends PageResponse<SupervisorEvaluationDashboardResponse> {
  totalFacultyCount: number;
  evaluatedFacultyCount: number;
  pendingFacultyCount: number;
}

export interface SupervisorEvaluationDashboardFilter {
  search?: string;
  evaluationStatus?: SupervisorEvaluationStatusFilter;
  legacyDatabase?: string;
  campus?: string;
  schoolYear?: number | null;
  semester?: string;
}

export interface AuditLogResponse {
  id: number;
  userId: number | null;
  username: string | null;
  entityType: string | null;
  entityId: number | null;
  action: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestMethod: string | null;
  requestPath: string | null;
  executionTimeMs: number | null;
  oldValue: string | null;
  newValue: string | null;
  status: 'SUCCESS' | 'FAILED' | 'RECORDED' | 'UNKNOWN' | string;
  createdAt: string;
}

export interface AuditLogFilter {
  userId?: number | null;
  username?: string;
  action?: string;
  entityType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface AuditLogSliceResponse {
  content: AuditLogResponse[];
  page: number;
  size: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface CsrfTokenResponse {
  token: string;
  headerName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly ADMIN_API_URL = `${environment.API_URL}/admin`;
  private readonly AUTH_API_URL = `${environment.API_URL}/auth`;
  private readonly MIGRATION_API_URL = `${environment.API_URL}/migration/all`;
  private readonly DASHBOARD_CACHE_TTL_MS = 5 * 60_000;
  private readonly CURRENT_TERM_CACHE_TTL_MS = 5 * 60_000;
  private dashboardCache$?: Observable<AdminDashboardResponse>;
  private dashboardCacheCreatedAt = 0;
  private currentTermCache$?: Observable<CurrentSchoolYearAndSemesterResponse>;
  private currentTermCacheCreatedAt = 0;
  private workloadCoverageCache$?: Observable<FacultyWorkloadCoverageResponse>;
  private workloadCoverageCacheCreatedAt = 0;

  getDashboard(forceRefresh = false): Observable<AdminDashboardResponse> {
    const isExpired =
      Date.now() - this.dashboardCacheCreatedAt > this.DASHBOARD_CACHE_TTL_MS;

    if (forceRefresh || !this.dashboardCache$ || isExpired) {
      this.dashboardCacheCreatedAt = Date.now();
      this.dashboardCache$ = this.http.get<AdminDashboardResponse>(
        `${this.ADMIN_API_URL}/dashboard`,
        {
          withCredentials: true,
        },
      ).pipe(
        catchError((error) => {
          this.dashboardCache$ = undefined;
          this.dashboardCacheCreatedAt = 0;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
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

  getFacultyWorkloadCoverage(
    forceRefresh = false,
  ): Observable<FacultyWorkloadCoverageResponse> {
    const isExpired =
      Date.now() - this.workloadCoverageCacheCreatedAt >
      this.DASHBOARD_CACHE_TTL_MS;

    if (forceRefresh || !this.workloadCoverageCache$ || isExpired) {
      this.workloadCoverageCacheCreatedAt = Date.now();
      this.workloadCoverageCache$ = this.http.get<FacultyWorkloadCoverageResponse>(
        `${this.ADMIN_API_URL}/dashboard/faculty-workload-coverage`,
        {
          withCredentials: true,
        },
      ).pipe(
        map((response) => repairSpecialCharacters(response)),
        catchError((error) => {
          this.workloadCoverageCache$ = undefined;
          this.workloadCoverageCacheCreatedAt = 0;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }

    return this.workloadCoverageCache$;
  }

  getSupervisorEvaluationDashboard(
    page: number = 0,
    size: number = 10,
    filters: SupervisorEvaluationDashboardFilter = {},
  ): Observable<SupervisorEvaluationDashboardPageResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.evaluationStatus && filters.evaluationStatus !== 'ALL') {
      params = params.set('evaluationStatus', filters.evaluationStatus);
    }

    if (filters.legacyDatabase?.trim()) {
      params = params.set('legacyDatabase', filters.legacyDatabase.trim());
    }

    if (filters.campus?.trim()) {
      params = params.set('campus', filters.campus.trim());
    }

    if (filters.schoolYear) {
      params = params.set('schoolYear', filters.schoolYear);
    }

    if (filters.semester?.trim()) {
      params = params.set('semester', filters.semester.trim());
    }

    return this.http.get<SupervisorEvaluationDashboardPageResponse>(
      `${this.ADMIN_API_URL}/dashboard/supervisor-evaluations`,
      {
        params,
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  getAuditLogs(
    page: number = 0,
    size: number = 25,
    filters: AuditLogFilter = {},
  ): Observable<PageResponse<AuditLogResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters.userId !== undefined && filters.userId !== null) {
      params = params.set('userId', filters.userId);
    }

    if (filters.username?.trim()) {
      params = params.set('username', filters.username.trim());
    }

    if (filters.action?.trim()) {
      params = params.set('action', filters.action.trim());
    }

    if (filters.entityType?.trim()) {
      params = params.set('entityType', filters.entityType.trim());
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.startDate?.trim()) {
      params = params.set('startDate', filters.startDate.trim());
    }

    if (filters.endDate?.trim()) {
      params = params.set('endDate', filters.endDate.trim());
    }

    return this.http.get<PageResponse<AuditLogResponse>>(
      `${this.ADMIN_API_URL}/audit-logs`,
      {
        params,
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  getAuditLogSlice(
    page: number = 0,
    size: number = 25,
    filters: AuditLogFilter = {},
  ): Observable<AuditLogSliceResponse> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (filters.userId !== undefined && filters.userId !== null) {
      params = params.set('userId', filters.userId);
    }

    if (filters.username?.trim()) {
      params = params.set('username', filters.username.trim());
    }

    if (filters.action?.trim()) {
      params = params.set('action', filters.action.trim());
    }

    if (filters.entityType?.trim()) {
      params = params.set('entityType', filters.entityType.trim());
    }

    if (filters.search?.trim()) {
      params = params.set('search', filters.search.trim());
    }

    if (filters.startDate?.trim()) {
      params = params.set('startDate', filters.startDate.trim());
    }

    if (filters.endDate?.trim()) {
      params = params.set('endDate', filters.endDate.trim());
    }

    return this.http.get<AuditLogSliceResponse>(
      `${this.ADMIN_API_URL}/audit-logs/slice`,
      {
        params,
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  clearDashboardCache(): void {
    this.dashboardCache$ = undefined;
    this.dashboardCacheCreatedAt = 0;
    this.clearWorkloadCoverageCache();
  }

  clearWorkloadCoverageCache(): void {
    this.workloadCoverageCache$ = undefined;
    this.workloadCoverageCacheCreatedAt = 0;
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

  getClassAssignments(
    page: number = 0,
    size: number = 20,
    search: string = '',
    legacyDatabase: string = '',
  ): Observable<PageResponse<ClassFacultyAssignmentResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (legacyDatabase.trim()) {
      params = params.set('legacyDatabase', legacyDatabase.trim());
    }

    return this.http.get<PageResponse<ClassFacultyAssignmentResponse>>(
      `${this.ADMIN_API_URL}/class-assignments`,
      { params, withCredentials: true },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  getClassAssignmentFacultyOptions(
    legacyDatabase: string = '',
  ): Observable<FacultyAssignmentOptionResponse[]> {
    let params = new HttpParams();

    if (legacyDatabase.trim()) {
      params = params.set('legacyDatabase', legacyDatabase.trim());
    }

    return this.http.get<FacultyAssignmentOptionResponse[]>(
      `${this.ADMIN_API_URL}/class-assignments/faculties`,
      { params, withCredentials: true },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  reassignClassFaculty(
    primaryClassId: number,
    facultyId: string,
    expectedCurrentFacultyId: string | null,
  ): Observable<ClassFacultyReassignmentResponse> {
    return this.http.patch<ClassFacultyReassignmentResponse>(
      `${this.ADMIN_API_URL}/class-assignments/${primaryClassId}/faculty`,
      { facultyId, expectedCurrentFacultyId },
      { withCredentials: true },
    ).pipe(
      map((response) => repairSpecialCharacters(response)),
      tap(() => this.clearDashboardCache()),
    );
  }

  getFacultyWorkloads(
    page: number = 0,
    size: number = 10,
    search: string = '',
    schoolYear?: number | null,
    semester: string = '',
  ): Observable<PageResponse<FacultyWorkloadResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (search.trim()) {
      params = params.set('search', search.trim());
    }

    if (schoolYear) {
      params = params.set('schoolYear', schoolYear);
    }

    if (semester.trim()) {
      params = params.set('semester', semester.trim());
    }

    return this.http.get<PageResponse<FacultyWorkloadResponse>>(
      `${this.ADMIN_API_URL}/faculty-workloads`,
      {
        params,
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  getFacultyWorkload(
    facultyId: string,
    schoolYear: number,
    semester: string,
    classCode: string | null | undefined,
    courseCode: string,
    programCode: string,
    yearLevel: string,
    sectionCode: string,
  ): Observable<FacultyWorkloadResponse> {
    const params = new HttpParams()
      .set('facultyId', facultyId)
      .set('schoolYear', schoolYear)
      .set('semester', semester)
      .set('courseCode', courseCode)
      .set('programCode', programCode)
      .set('yearLevel', yearLevel)
      .set('sectionCode', sectionCode);
    const requestParams = classCode
      ? params.set('classCode', classCode)
      : params;

    return this.http.get<FacultyWorkloadResponse>(
      `${this.ADMIN_API_URL}/faculty-workloads/record`,
      {
        params: requestParams,
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  getFacultyWorkloadById(
    facultyWorkloadId: number,
  ): Observable<FacultyWorkloadResponse> {
    return this.http.get<FacultyWorkloadResponse>(
      `${this.ADMIN_API_URL}/faculty-workloads/${facultyWorkloadId}`,
      {
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  upsertFacultyWorkload(
    payload: FacultyWorkloadRequest,
  ): Observable<FacultyWorkloadResponse> {
    return this.http.get<CsrfTokenResponse>(
      `${this.AUTH_API_URL}/csrf`,
      { withCredentials: true },
    ).pipe(
      switchMap((csrf) =>
        this.http.put<FacultyWorkloadResponse>(
          `${this.ADMIN_API_URL}/faculty-workloads`,
          payload,
          {
            headers: {
              [csrf.headerName || 'X-XSRF-TOKEN']: csrf.token,
            },
            withCredentials: true,
          },
        ),
      ),
      tap(() => {
        this.clearDashboardCache();
        this.clearWorkloadCoverageCache();
      }),
    );
  }

  deleteFacultyWorkload(facultyWorkloadId: number): Observable<void> {
    return this.http.get<CsrfTokenResponse>(
      `${this.AUTH_API_URL}/csrf`,
      { withCredentials: true },
    ).pipe(
      switchMap((csrf) =>
        this.http.delete<void>(
          `${this.ADMIN_API_URL}/faculty-workloads/${facultyWorkloadId}`,
          {
            headers: {
              [csrf.headerName || 'X-XSRF-TOKEN']: csrf.token,
            },
            withCredentials: true,
          },
        ),
      ),
      tap(() => {
        this.clearDashboardCache();
        this.clearWorkloadCoverageCache();
      }),
    );
  }

  getFacultyWorkloadSectionOptions(
    schoolYear: number,
    semester: string,
  ): Observable<FacultyWorkloadSectionOptionResponse[]> {
    const params = new HttpParams()
      .set('schoolYear', schoolYear)
      .set('semester', semester);

    return this.http.get<FacultyWorkloadSectionOptionResponse[]>(
      `${this.ADMIN_API_URL}/faculty-workloads/section-options`,
      {
        params,
        withCredentials: true,
      },
    );
  }

  getFacultyWorkloadClassOptions(
    facultyId: string,
    schoolYear: number,
    semester: string,
  ): Observable<FacultyWorkloadClassOptionResponse[]> {
    const params = new HttpParams()
      .set('facultyId', facultyId)
      .set('schoolYear', schoolYear)
      .set('semester', semester);

    return this.http.get<FacultyWorkloadClassOptionResponse[]>(
      `${this.ADMIN_API_URL}/faculty-workloads/class-options`,
      {
        params,
        withCredentials: true,
      },
    );
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

  generateFacultyEvaluationReport(
    facultyId: string,
  ): Observable<FacultyEvaluationGeneratedReportResponse> {
    return this.http.post<FacultyEvaluationGeneratedReportResponse>(
      `${this.ADMIN_API_URL}/faculty-evaluation-reports/${encodeURIComponent(facultyId)}`,
      {},
      {
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
  }

  generateBulkFacultyEvaluationReports(
    legacyDatabase: string = '',
    college: string = '',
  ): Observable<FacultyEvaluationBulkReportResponse> {
    let params = new HttpParams();

    if (legacyDatabase.trim()) {
      params = params.set('legacyDatabase', legacyDatabase.trim());
    }

    if (college.trim()) {
      params = params.set('college', college.trim());
    }

    return this.http.post<FacultyEvaluationBulkReportResponse>(
      `${this.ADMIN_API_URL}/faculty-evaluation-reports/bulk`,
      {},
      {
        params,
        withCredentials: true,
      },
    ).pipe(map((response) => repairSpecialCharacters(response)));
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
      ).pipe(
        catchError((error) => {
          this.currentTermCache$ = undefined;
          this.currentTermCacheCreatedAt = 0;
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
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


