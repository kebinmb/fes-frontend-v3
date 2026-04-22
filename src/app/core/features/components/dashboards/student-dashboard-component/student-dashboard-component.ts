import { Component, inject } from '@angular/core';
import { StudentDataFacade } from '../../../../store/student-data/student-data.facade';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { AuthFacade } from '../../../../store/auth/auth.facade';
import { filter, map, take } from 'rxjs';

@Component({
  selector: 'app-student-dashboard-component',
  imports: [AsyncPipe, JsonPipe, CommonModule],
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
  startEvaluation(_t55: any, $event: PointerEvent) {
    throw new Error('Method not implemented.');
  }
  logout() {
    throw new Error('Method not implemented.');
  }
}
