import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
export interface StudentClassLoadDTO {
  classCode: string;
  facultyId: string;
  subjectCode: string;
  sectionId: number;
  yearLevel: string;
  semester: string;
  schoolYear: number;
  studentId: string;
  facultyName: string;
  subjectDescription?: string;
  college: string;
}
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}
@Injectable({
  providedIn: 'root',
})
export class StudentDataService {
  private readonly STUDENT_DATA_URL = `${environment.API_URL}/student`;
  private http = inject(HttpClient);

  getStudentLoads(
    studentId: string,
    page: number = 0,
    size: number = 20,
    sort: string = 'primaryStudentLoadId,desc',
  ): Observable<PageResponse<StudentClassLoadDTO>> {
    const params = new HttpParams()
      .set('studentId', studentId)
      .set('page', page)
      .set('size', size)
      .set('sort', sort);

    return this.http.get<PageResponse<StudentClassLoadDTO>>(
      `${this.STUDENT_DATA_URL}/student-loads`,
      { params, withCredentials: true },
    );
  }
}
