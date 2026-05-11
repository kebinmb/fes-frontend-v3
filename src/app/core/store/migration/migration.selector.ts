import { createFeatureSelector, createSelector } from '@ngrx/store';
import { MigrationState } from './migration.state';


export const migrationFeatureKey = 'migrationData';

export const selectMigrationState =
    createFeatureSelector<MigrationState>(migrationFeatureKey);

export const selectMigrationResponse = createSelector(
    selectMigrationState,
    (state) => state.response,
);

export const selectMigrationLoading = createSelector(
    selectMigrationState,
    (state) => state.isLoading,
);

export const selectMigrationError = createSelector(
    selectMigrationState,
    (state) => state.error,
);