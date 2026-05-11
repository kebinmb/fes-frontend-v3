import { createAction, props } from '@ngrx/store';
import { MigrationResponse } from '../../services/admin/admin-service';


export const migrateAll = createAction(
  '[Migration] Migrate All',
);

export const migrateAllSuccess = createAction(
  '[Migration] Migrate All Success',
  props<{
    response: MigrationResponse<void>;
  }>(),
);

export const migrateAllFailure = createAction(
  '[Migration] Migrate All Failure',
  props<{
    error: string;
  }>(),
);

export const resetMigrationState = createAction(
  '[Migration] Reset Migration State',
);