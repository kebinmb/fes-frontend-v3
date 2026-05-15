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
  yearLevel: string;
  facultyId: string;
  schoolYear: number;
  semester: string;
  classCode: string;
  isEvaluated?: boolean;
  subjectDescription: string;
  college: string;
  programCode: string;
  sectionCode: string;
}

export interface FacultyLoadDTO {
  facultyId: string;
  firstname: string;
  lastname:string;
  position: string;
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

  loadFacultyClasses(facultyId: string, program:string): Observable<FacultyClass[]> {
    if (!facultyId?.trim()) {
      throw new Error('Invalid facultyId');
    }
    const params = new HttpParams().set('facultyId', facultyId.trim()).set('program', program.trim());
    return this.http.get<FacultyClass[]>(`${this.FACULTY_API_URL}/faculty-classes`, {
      params,
      withCredentials: true,
    });
  }

  getFacultyLoadsByProgram(programCode: string): Observable<FacultyLoadDTO[]> {
    const params = new HttpParams().set('programCode', programCode);

    return this.http.get<FacultyLoadDTO[]>(`${this.FACULTY_API_URL}/faculty-loads`, {
      params,
      withCredentials: true,
    });
  }
}
