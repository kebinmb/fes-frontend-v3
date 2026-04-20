export interface AuthState {
    evaluatorId: string | null;
    role: 'ROLE_STUDENT' | 'ROLE_DEAN' | 'ROLE_ADMIN' | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
    accessCode: string | null;
    // isLoaded: boolean;
}
export const initialAuthState: AuthState = {
    evaluatorId: null,
    role: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    accessCode: null
    // isLoaded: false
}