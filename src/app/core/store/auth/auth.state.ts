export interface AuthState {
    evaluatorId: string | null;
    role: 'ROLE_STUDENT' | 'ROLE_DEAN' | 'ROLE_ADMIN' | 'ROLE_PROGRAM_CHAIR' | 'ROLE_HR' | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    isAuthChecked:boolean;
    error: string | null;
    accessCode: string | null;
    accessCodeSent: boolean;
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
    accessCodeSent: false,
    college:null
    // isLoaded: false
}
