import { inject, Injectable } from '@angular/core';
import * as AuthActions from './auth.action';
import { Store } from '@ngrx/store';
import {
  selectAccessCode,
  selectAuthenticationError,
  selectAuthenticationState,
  selectCollege,
  selectEvaluatorId,
  selectRole,
} from './auth.selector';
import { selectLoading } from '../spinner/spinner.selector';
@Injectable({
  providedIn: 'root',
})
export class AuthFacade {
  private store = inject(Store);
  isAuthenticated$ = this.store.select(selectAuthenticationState);
  evaluatorId$ = this.store.select(selectEvaluatorId);
  role$ = this.store.select(selectRole);
  isLoading$ = this.store.select(selectLoading);
  accessCode$ = this.store.select(selectAccessCode);
  error$ = this.store.select(selectAuthenticationError);
  college$ = this.store.select(selectCollege);
  loginSupervisor(username: string, password: string) {
    this.store.dispatch(
      AuthActions.supervisorLogin({
        username: username,
        password,
      }),
    );
  }

  loginStudent(studentId:string,accessCode:string){
    this.store.dispatch(AuthActions.studentLogin({
      evaluatorId:studentId,
      accessCode:accessCode
    }),
  );
  }
  
  generateStudentAccessCode(evaluatorId: string) {
    this.store.dispatch(AuthActions.generateAccessCodeForStudent({ evaluatorId }));
  }
  logout() {
    this.store.dispatch(AuthActions.logout());
  }

  checkLoggedInUserAuthentication() {
    this.store.dispatch(AuthActions.checkLoggedInUserAuthentication());
  }
}
