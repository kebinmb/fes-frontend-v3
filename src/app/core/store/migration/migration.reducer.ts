import { createReducer, on } from '@ngrx/store';
import * as MigrationActions from './migration.actions';
import { initialMigrationDataState } from './migration.state';

export const migrationReducer = createReducer(

    initialMigrationDataState,

    on(MigrationActions.migrateAll, (state) => ({
        ...state,
        isLoading: true,
        error: null,
    })),

    on(MigrationActions.migrateAllSuccess, (state, { response }) => ({
        ...state,
        response,
        isLoading: false,
        error: null,
    })),

    on(MigrationActions.migrateAllFailure, (state, { error }) => ({
        ...state,
        isLoading: false,
        error,
    })),

    on(MigrationActions.resetMigrationState, () => ({
        ...initialMigrationDataState,
    })),
);