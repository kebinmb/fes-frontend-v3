import { createAction, props } from '@ngrx/store';

export const generateAccessCodeForStudent = createAction(
  '[Student Authentication] Generating access code for Student',
  props<{ evaluatorId: string, password:string }>(),
);

export const generateAccessCodeForStudentSuccess = createAction(
  '[Student Authentication] Access code generated successfully',
  props<{ accessCode: string }>(),
);

export const generateAccessCodeForStudentFailure = createAction(
  '[Student Authentication] Failed to generated access code',
  props<{ error: string }>(),
);

export const studentLogin = createAction(
  '[Student Authentication] Student Login',
  props<{ evaluatorId: string; accessCode: string }>(),
);

export const studentLoginSuccess = createAction(
  '[Student Authentication] Student Login Successful',
  props<{ evaluatorId: string; role: 'ROLE_STUDENT'; accessCode: string }>(),
);

export const studentLoginFailure = createAction(
  '[Student Authentication] Student Login Failure',
  props<{ error: string }>(),
);

export const supervisorLogin = createAction(
  '[Supervisor Authentication] Supervisor Login',
  props<{ username: string; password: string }>(),
);

export const supervisorLoginSuccess = createAction(
  '[Supervisor Authentication] Supervisor Login Successful',
  props<{ evaluatorId: string; role: 'ROLE_DEAN'; college: string }>(),
);

export const supervisorLoginFailure = createAction(
  '[Supervisor Authentication] Supervisor Login Failed',
  props<{ error: string }>(),
);
export const administratorLogin = createAction(
  '[Administrator Authentication] Administrator Login',
  props<{ username: string; password: string }>(),
);
export const administratorLoginSuccess = createAction(
  '[Administrator Authentication] Administrator Login Success',
  props<{ administratorId: string; role: 'ROLE_ADMIN' }>(),
);
export const administratorLoginFailure = createAction(
  '[Supervisor Authentication] Administrator Login Failed',
  props<{ error: string }>(),
);
export const checkLoggedInUserAuthentication = createAction(
  '[Authentication Check] Checking Logged in User Authentication',
);

export const checkLoggedInUserAuthenticationSuccess = createAction(
  '[Authentication Check] Authentication Check Success',
  props<{
    evaluatorId: string;
    role: 'ROLE_STUDENT' | 'ROLE_DEAN' | 'ROLE_ADMIN';
    college: string;
  }>(),
);

export const checkLoggedInUserAuthenticationFailure = createAction(
  '[Authentication Check] Authentication Check Failed',
  props<{ error: string }>(),
);
export const logout = createAction('[Logout] Logout');
