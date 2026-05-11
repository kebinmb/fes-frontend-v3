import { Component, inject } from '@angular/core';
import { MigrationFacade } from '../../../store/migration/migration.facade';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
  selector: 'app-settings-component',
  imports: [AsyncPipe, DatePipe],
  templateUrl: './settings-component.html',
  styleUrl: './settings-component.css',
})
export class SettingsComponent {
  private migrationFacade = inject(MigrationFacade);
  migrationResponse$ =
    this.migrationFacade.migrationResponse$;

  migrationLoading$ =
    this.migrationFacade.migrationLoading$;

  migrationError$ =
    this.migrationFacade.migrationError$;
  showAdvancedSettings = false;

  toggleAdvancedSettings(): void {

    this.showAdvancedSettings =
      !this.showAdvancedSettings;
  }

  startMigration(): void {

    this.migrationFacade.migrateAll();
  }
}
