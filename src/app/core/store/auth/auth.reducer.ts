import { createReducer, on } from '@ngrx/store';
import * as AuthActions from './auth.action';
import { initialAuthState } from './auth.state';

export const authReducer = createReducer(
    initialAuthState,
    on(AuthActions.generateAccessCodeForStudent, (state, { evaluatorId }) => ({
        ...state,
        evaluatorId,
        isLoading: true
    })),
    on(AuthActions.generateAccessCodeForStudentSuccess, (state, { accessCode }) => ({
        ...state,
        accessCode,
        isLoading: false
    })),
    on(AuthActions.generateAccessCodeForStudentFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error
    })),
    on(AuthActions.studentLogin, (state, { evaluatorId, accessCode }) => ({
        ...state,
        evaluatorId,
        accessCode,
        isLoading: true,
    })),
    on(AuthActions.studentLoginSuccess, (state, { evaluatorId, role, accessCode }) => ({
        ...state,
        evaluatorId,
        role,
        accessCode,
        isLoading: false,
        isAuthenticated: true
    })),
    on(AuthActions.studentLoginFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        isAuthenticated: false,
        error
    })),
    on(AuthActions.supervisorLogin, (state) => ({
        ...state,
        isLoading: true,
        isAuthenticated: false
    })),
    on(AuthActions.supervisorLoginSuccess, (state, { evaluatorId, role }) => ({
        ...state,
        evaluatorId,
        role,
        isLoading: false,
        isAuthenticated: true
    })),
    on(AuthActions.supervisorLoginFailure, (state, { error }) => ({
        ...state,
        error,
        isLoading: false,
        isAuthenticated: false
    })),
    on(AuthActions.checkLoggedInUserAuthentication, (state) => ({
        ...state,
        isAuthenticated: false,
        isLoading: true
    })),
    on(AuthActions.checkLoggedInUserAuthenticationSuccess, (state, { evaluatorId, role }) => ({
        ...state,
        isAuthenticated: true,
        isLoading: false,
        evaluatorId,
        role
    })),
    on(AuthActions.checkLoggedInUserAuthenticationFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        isAuthenticated: false,
        error
    })),
    on(AuthActions.logout, () => initialAuthState)

)