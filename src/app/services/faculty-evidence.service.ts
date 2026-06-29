import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  EvidenceCriterion,
  FacultyEvidence,
  PageResponse,
} from '@app/models/faculty-evidence.model';

export interface UploadEvidencePayload {
  facultyId: string;
  criterion: string;
  file: File;
  classCode?: string;
  subjectCode?: string;
  yearLevel?: string;
  semester?: string;
  schoolYear?: number;
  description?: string;
}

export interface EvidenceListFilters {
  facultyId: string;
  classCode?: string;
  subjectCode?: string;
  semester?: string;
  schoolYear?: number;
  criterion?: string;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root',
})
export class FacultyEvidenceService {
  private readonly baseUrl = `${environment.API_URL}/faculty/evidences`;
  private readonly http = inject(HttpClient);

  getCriteria(): Observable<EvidenceCriterion[]> {
    return this.http.get<EvidenceCriterion[]>(`${this.baseUrl}/criteria`);
  }

  uploadEvidence(payload: UploadEvidencePayload): Observable<FacultyEvidence> {
    const formData = new FormData();

    formData.append('facultyId', payload.facultyId);
    formData.append('criterion', payload.criterion);
    formData.append('file', payload.file);

    if (payload.classCode) formData.append('classCode', payload.classCode);
    if (payload.subjectCode) formData.append('subjectCode', payload.subjectCode);
    if (payload.yearLevel) formData.append('yearLevel', payload.yearLevel);
    if (payload.semester) formData.append('semester', payload.semester);
    if (payload.schoolYear) formData.append('schoolYear', String(payload.schoolYear));
    if (payload.description) formData.append('description', payload.description);

    return this.http.post<FacultyEvidence>(this.baseUrl, formData);
  }

  getEvidenceList(filters: EvidenceListFilters): Observable<PageResponse<FacultyEvidence>> {
    let params = new HttpParams()
      .set('facultyId', filters.facultyId)
      .set('page', String(filters.page ?? 0))
      .set('size', String(filters.size ?? 10))
      .set('sort', 'createdAt,desc');

    if (filters.classCode) params = params.set('classCode', filters.classCode);
    if (filters.subjectCode) params = params.set('subjectCode', filters.subjectCode);
    if (filters.semester) params = params.set('semester', filters.semester);
    if (filters.schoolYear) params = params.set('schoolYear', String(filters.schoolYear));
    if (filters.criterion) params = params.set('criterion', filters.criterion);

    return this.http.get<PageResponse<FacultyEvidence>>(this.baseUrl, { params });
  }

  downloadEvidence(evidenceId: number) {
    return this.http.get(`${this.baseUrl}/${evidenceId}/download`, {
      responseType: 'blob',
      observe: 'response',
    });
  }

  deleteEvidence(evidenceId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${evidenceId}`);
  }
}
