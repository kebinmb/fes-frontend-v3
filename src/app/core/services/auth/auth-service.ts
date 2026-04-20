import { inject, Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment.development';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly AUTH_URL = `${environment.API_URL}/auth`;
  private http = inject(HttpClient)

  generateStudentAccessCode(studentId: string) {
    return this.http.post<{ studentId: string; accessCode: string; expiresAt: string; }>(
      `${this.AUTH_URL}/access-code/generate`,
      {},
      {
        params: { studentId },
        withCredentials: true
      }
    )
  }

  studentLogin(studentId: string, accessCode: string) {
    return this.http.post<{ message: string, studentId: string }>(
      `${this.AUTH_URL}/student/login`,
      {},
      {
        params: { studentId, accessCode },
        withCredentials: true
      },
    );
  }

  supervisorLogin(usernameOrEmail: string, password: string) {
    return this.http.post<{ message: string, evaluatorId: string }>(
      `${this.AUTH_URL}/supervisor/login`,
      { usernameOrEmail, password },
      {
        withCredentials: true
      }
    );
  }
  getCurrentUser() {
    return this.http.get(`${this.AUTH_URL}/me`, { withCredentials: true });
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
}
