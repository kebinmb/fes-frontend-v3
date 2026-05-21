import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
export interface FacultyDTO {
  facultyId: string;
  lastname: string;
  firstname: string;
  position: string;
  loadLimit: number;
  middlename: string;
  college: string;
  status: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // current page
}
export interface FacultyWithClasses {
  faculty: any;
  classes: any[];
}
export interface FacultyClass {

  subjectCode: string;

  facultyId: string;

  schoolYear: number;

  semester: string;

  classCode: string;

  yearLevel: string;

  programCode: string;

  sectionCode: string;

  isEvaluated?: boolean;

  loading?: boolean;

  subjectDescription:string;
  
  error?: string | null;
}

export interface FacultyLoadDTO {
  facultyId: string;
  firstname: string;
  lastname: string;
  position: string;
  college: string;
  // subjectCode: string;
  // programYearSection: string;
  campus: string;
  loadLimit: number;
  typeOfLoad: string;
}
@Injectable({
  providedIn: 'root',
})
export class SupervisorDataService {
  private readonly FACULTY_API_URL = `${environment.API_URL}/faculty`;
  private http = inject(HttpClient);

  getFaculties(college: string, status: string): Observable<FacultyDTO[]> {
    console.log('Service Running');

    const params = new HttpParams().set('college', college).set('status', status);

    return this.http.get<FacultyDTO[]>(`${this.FACULTY_API_URL}/list`, {
      params,
      withCredentials: true,
    });
  }

  loadFacultyClasses(
  facultyId: string
): Observable<FacultyClass[]> {

  if (!facultyId?.trim()) {
    throw new Error('Invalid facultyId');
  }

  const params = new HttpParams()
    .set('facultyId', facultyId.trim());

  return this.http.get<FacultyClass[]>(
    `${this.FACULTY_API_URL}/faculty-classes`,
    {
      params,
      withCredentials: true,
    }
  );
}

  getFacultyLoadsByProgram(
    userId: number,
    page: number = 0,
    size: number = 10,
    sort: string = 'lastname,asc',
    search: string = '',
  ): Observable<PageResponse<FacultyLoadDTO>> {
    let params = new HttpParams()
      .set('userId', userId.toString())
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    return this.http.get<PageResponse<FacultyLoadDTO>>(`${this.FACULTY_API_URL}/faculty-loads`, {
      params,
      withCredentials: true,
    });
  }
}
