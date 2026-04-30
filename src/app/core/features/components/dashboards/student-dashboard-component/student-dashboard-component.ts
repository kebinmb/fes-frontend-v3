import { Component, inject } from '@angular/core';
import { StudentDataFacade } from '../../../../store/student-data/student-data.facade';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { AuthFacade } from '../../../../store/auth/auth.facade';
import { filter, map, take } from 'rxjs';
import { StudentClassLoadDTO } from '../../../../services/student-data/student-data-service';
import { EvaluationClass } from '../../../../services/evaluation/evaluation-service';

@Component({
  selector: 'app-student-dashboard-component',
  imports: [AsyncPipe, CommonModule],
  templateUrl: './student-dashboard-component.html',
  styleUrl: './student-dashboard-component.css',
})
export class StudentDashboardComponent {
  private studentDataFacade = inject(StudentDataFacade);
  private authFacade = inject(AuthFacade);

  isReady$ = this.studentDataFacade.isReady$;
  isLoading$ = this.studentDataFacade.isLoading$;
  studentLoads$ = this.studentDataFacade.studentLoads$;
  evaluatorId$ = this.authFacade.evaluatorId$;
  evaluatedCount$ = this.studentLoads$.pipe(
    map((loads) => loads?.filter((load) => load.isEvaluated)?.length ?? 0),
  );
  ngOnInit() {
    this.evaluatorId$
      .pipe(
        filter((id): id is string => !!id),
        take(1),
      )
      .subscribe((id) => {
        this.studentDataFacade.loadStudentLoads(id, 0, 10, 'desc');
      });
  }

  unevaluatedCount$ = this.studentLoads$.pipe(
    map((loads) => (loads?.length ?? 0) - (loads?.filter((l) => l.isEvaluated)?.length ?? 0)),
  );
  startEvaluation(cls: StudentClassLoadDTO, event: Event) {
    event.stopPropagation();

    const selectedClass: EvaluationClass = {
      ...cls,
    };

    this.studentDataFacade.selectClassForEvaluation(selectedClass);

    const key = `${cls.facultyId}-${cls.classCode}-${cls.semester}-${cls.schoolYear}`;
    sessionStorage.setItem('selectedClassKey', key);
  }
  onEvaluateClick(cls: any, event: Event) {
    event.stopPropagation();
    this.startEvaluation(cls, event);
  }
  logout() {
    this.authFacade.logout();
  }
}
