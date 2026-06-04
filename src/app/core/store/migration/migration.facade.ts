import { inject, Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as MigrationActions from './migration.actions';
import * as MigrationSelectors from './migration.selector';

@Injectable({
  providedIn: 'root',
})
export class MigrationFacade {

  private store = inject(Store);

  migrationResponse$ = this.store.select(
    MigrationSelectors.selectMigrationResponse,
  );

  migrationLoading$ = this.store.select(
    MigrationSelectors.selectMigrationLoading,
  );

  migrationError$ = this.store.select(
    MigrationSelectors.selectMigrationError,
  );

  migrateAll(): void {

    this.store.dispatch(
      MigrationActions.migrateAll(),
    );
  }

  resetMigrationState(): void {

    this.store.dispatch(
      MigrationActions.resetMigrationState(),
    );
  }
}