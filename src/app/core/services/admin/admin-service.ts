import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
import { FacultyEvaluationScore, Page } from '../evaluation/evaluation-service';
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
}
export interface FetchUserAccountsResponse {
  userId: string;
  username: string;
  email: string;
  role: string;
  status: string;
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
@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private http = inject(HttpClient);
  private readonly ADMIN_API_URL = `${environment.API_URL}/admin`;
  private readonly MIGRATION_API_URL = `${environment.API_URL}/migration/all`;
  getFaculties(
    page: number = 0,
    size: number = 10,
    search: string = '',
  ): Observable<PageResponse<FetchFacultyResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);

    if (search.trim()) {
      params = params.set('search', search);
    }

    return this.http.get<PageResponse<FetchFacultyResponse>>(`${this.ADMIN_API_URL}/faculties`, {
      params,
      withCredentials: true,
    });
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
    );
  }

  fetchCurrentSchoolYearAndSemester():
    Observable<CurrentSchoolYearAndSemesterResponse> {

    return this.http.get<
      CurrentSchoolYearAndSemesterResponse
    >(
      `${this.ADMIN_API_URL}/school-year-semester`,
      {
        withCredentials: true,
      },
    );
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
}


