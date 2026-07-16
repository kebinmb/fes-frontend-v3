import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export type AuthenticatedRole =
  | 'ROLE_STUDENT'
  | 'ROLE_DEAN'
  | 'ROLE_PROGRAM_CHAIR'
  | 'ROLE_ADMIN'
  | 'ROLE_HR';

export interface GenerateStudentAccessCodeResponse {
  studentId: string;
  expiresAt: string;
  message: string;
}

export interface StudentLoginResponse {
  message: string;
  studentId: string;
}

export interface SupervisorLoginResponse {
  message: string;
  evaluatorId: string;
}

export interface AdministratorLoginResponse {
  message: string;
  administratorId: string;
  role?: 'ROLE_ADMIN' | 'ROLE_HR';
  college?: string;
}

export interface CurrentUserResponse {
  studentId?: string;
  userId?: string;
  administratorId?: string;
  evaluatorId?: string;
  role: AuthenticatedRole;
  college?: string | null;
  program?: string;
  requiresPasswordChange?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}
@Injectable({
  providedIn: 'root',
})

export class AuthService {
  private readonly AUTH_URL = `${environment.API_URL}/auth`;
  private http = inject(HttpClient)

  generateStudentAccessCode(
    studentId: string,
    password: string
  ): Observable<GenerateStudentAccessCodeResponse> {
    return this.http.post<GenerateStudentAccessCodeResponse>(
      `${this.AUTH_URL}/access-code/generate`,
      { studentId, password },
      {
        withCredentials: true
      }
    );
  }

  studentLogin(studentId: string, accessCode: string): Observable<StudentLoginResponse> {
    return this.http.post<StudentLoginResponse>(
      `${this.AUTH_URL}/student/login`,
      { studentId, accessCode },
      {
        withCredentials: true
      },
    );
  }

  getCsrfToken() {
    return this.http.get<{ token: string; headerName: string }>(
      `${this.AUTH_URL}/csrf`,
      { withCredentials: true },
    );
  }

  supervisorLogin(
    usernameOrEmail: string,
    password: string,
  ): Observable<SupervisorLoginResponse> {
    return this.http.post<SupervisorLoginResponse>(
      `${this.AUTH_URL}/supervisor/login`,
      { usernameOrEmail, password },
      {
        withCredentials: true
      }
    );
  }

  administratorLogin(
    usernameOrEmail: string,
    password: string,
  ): Observable<AdministratorLoginResponse> {
    return this.http.post<AdministratorLoginResponse>(
      `${this.AUTH_URL}/administrator/login`,
      { usernameOrEmail, password },
      {
        withCredentials: true
      }
    )
  }

  getCurrentUser(): Observable<CurrentUserResponse> {
    return this.http.get<CurrentUserResponse>(`${this.AUTH_URL}/me`, { withCredentials: true });
  }
  logout() {
    return this.http.post<{ message: string }>(
      `${this.AUTH_URL}/logout`,
      {},
      {
        withCredentials: true,
      },
    );
  }
  changePassword(
    request: ChangePasswordRequest
  ): Observable<string> {
    return this.http.put(
      `${this.AUTH_URL}/change-password`,
      request,
      {
        responseType: 'text',
        withCredentials: true,
      }
    );
  }
}
