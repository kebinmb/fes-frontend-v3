import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { StudentDataFacade } from '@core/store/student-data/student-data.facade';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthFacade } from '@core/store/auth/auth.facade';
import { filter, map, take } from 'rxjs';
import {
  StudentClassLoadWithEvaluation,
} from '@core/services/student-data/student-data-service';
import { EvaluationClass } from '@core/services/evaluation/evaluation-service';

@Component({
  selector: 'app-student-dashboard-component',
  imports: [AsyncPipe, CommonModule],
  templateUrl: './student-dashboard-component.html',
  styleUrl: './student-dashboard-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StudentDashboardComponent implements OnInit {
  private studentDataFacade = inject(StudentDataFacade);
  private authFacade = inject(AuthFacade);
  private destroyRef = inject(DestroyRef);

  isReady$ = this.studentDataFacade.isReady$;
  isLoading$ = this.studentDataFacade.isLoading$;
  studentLoads$ = this.studentDataFacade.studentLoads$;
  evaluatorId$ = this.authFacade.evaluatorId$;
  evaluatedCount$ = this.studentLoads$.pipe(
    map((loads) => loads?.filter((load) => load.isEvaluated === true).length ?? 0),
  );
  unevaluatedCount$ = this.studentLoads$.pipe(
    map((loads) => loads?.filter((load) => load.isEvaluated === false).length ?? 0),
  );

  ngOnInit() {
    this.evaluatorId$
      .pipe(
        filter((id): id is string => !!id),
        takeUntilDestroyed(this.destroyRef),
        take(1),
      )
      .subscribe((id) => {
        this.studentDataFacade.loadStudentLoads(id, 0, 20, 'primaryStudentLoadId,desc');
      });
  }

  startEvaluation(cls: EvaluationClass, event: Event) {
    event.stopPropagation();
    const selectedClass: EvaluationClass = {
      ...cls,
    };
    this.studentDataFacade.selectClassForEvaluation(selectedClass);
  }

  onEvaluateClick(cls: StudentClassLoadWithEvaluation, event: Event) {
    event.stopPropagation();
    this.startEvaluation(cls, event);
  }

  logout() {
    this.authFacade.logout();
  }
}
