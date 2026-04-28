export interface AuthState {
    evaluatorId: string | null;
    role: 'ROLE_STUDENT' | 'ROLE_DEAN' | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAuthChecked:boolean;
    error: string | null;
    accessCode: string | null;
    college:string | null;
    // isLoaded: boolean;
}
export const initialAuthState: AuthState = {
    evaluatorId: null,
    role: null,
    isAuthenticated: false,
    isLoading: false,
    isAuthChecked:false,
    error: null,
    accessCode: null,
    college:null
    // isLoaded: false
}