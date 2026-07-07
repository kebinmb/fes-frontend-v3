import {
  Component,
  inject,
  OnInit,
} from '@angular/core';

import {
  AsyncPipe,
} from '@angular/common';

import { FormsModule } from '@angular/forms';

import { take } from 'rxjs';

import { MigrationFacade }
  from '@core/store/migration/migration.facade';

import { SchoolYearAndSemesterFacade }
  from '@core/store/school-year-and-semester/school-year-and-semester.facade';

import {
  Semester,
} from '@core/services/admin/admin-service';

import { ConfirmationModalComponent }
  from '@shared/components/confirmation-modal-component/confirmation-modal-component';

@Component({
  selector: 'app-settings-component',

  standalone: true,

  imports: [
    AsyncPipe,
    FormsModule,
    ConfirmationModalComponent,
  ],

  templateUrl: './settings-component.html',

  styleUrl: './settings-component.css',
})
export class SettingsComponent
  implements OnInit {
  private migrationFacade =
    inject(MigrationFacade);
  private schoolYearFacade =
    inject(SchoolYearAndSemesterFacade);
  migrationResponse$ =
    this.migrationFacade.migrationResponse$;
  migrationLoading$ =
    this.migrationFacade.migrationLoading$;
  migrationError$ =
    this.migrationFacade.migrationError$;
  schoolYearResponse$ =
    this.schoolYearFacade.response$;

  schoolYearLoading$ =
    this.schoolYearFacade.loading$;
  schoolYearError$ =
    this.schoolYearFacade.error$;
  schoolYear =
    new Date().getFullYear();
  semester: Semester =
    'FIRST_SEMESTER';
  showAdvancedSettings =
    false;
  showMigrationConfirmation =
    false;

  ngOnInit(): void {
    this.schoolYearFacade
      .fetchCurrentSchoolYearAndSemester();
    this.schoolYearResponse$
      .pipe(take(1))
      .subscribe((response) => {

        if (!response) {

          return;
        }

        this.schoolYear =
          response.schoolYear;

        this.semester =
          response.semester as Semester;
      });
  }

  toggleAdvancedSettings(): void {

    this.showAdvancedSettings =
      !this.showAdvancedSettings;
  }

  startMigration(): void {

    this.showMigrationConfirmation =
      true;

  }

  confirmMigration(): void {

    this.showMigrationConfirmation =
      false;

    this.migrationFacade
      .migrateAll();
  }

  closeMigrationConfirmation(): void {

    this.showMigrationConfirmation =
      false;

  }

  updateSchoolYearAndSemester():
    void {

    this.schoolYearFacade
      .updateSchoolYearAndSemester(
        this.schoolYear,
        this.semester,
      );
  }

  formatSemester(
  semester: string | null | undefined,
): string {

  switch (semester) {

    case 'FIRST_SEMESTER':

      return 'First Semester';

    case 'SECOND_SEMESTER':

      return 'Second Semester';

    case 'SUMMER_SEMESTER':

      return 'Summer Semester';

    default:

      return semester ?? '-';
  }
}
}
