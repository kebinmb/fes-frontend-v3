import { MigrationResponse } from "../../services/admin/admin-service";


export interface MigrationState {
    response: MigrationResponse<void> | null;
    isLoading: boolean;
    error: string | null;
}

export const initialMigrationDataState: MigrationState = {
    response: null,
    isLoading: false,
    error: null,
};
