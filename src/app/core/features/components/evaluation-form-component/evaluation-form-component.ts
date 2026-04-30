import { Component, inject } from '@angular/core';
import { StudentDataFacade } from '../../../store/student-data/student-data.facade';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, filter, take } from 'rxjs';
import { AuthFacade } from '../../../store/auth/auth.facade';
import { SupervisorDataFacade } from '../../../store/supervisor-data/supervisor-data.facade';
export type UserRole = 'ROLE_STUDENT' | 'ROLE_DEAN' | 'ROLE_ADMIN';
@Component({
  selector: 'app-evaluation-form-component',
  imports: [AsyncPipe],
  templateUrl: './evaluation-form-component.html',
  styleUrl: './evaluation-form-component.css',
})
export class EvaluationFormComponent {
  private studentDataFacade = inject(StudentDataFacade);
  private router = inject(Router);
  private authFacade = inject(AuthFacade);
  private supervisorDataFacade = inject(SupervisorDataFacade);
  selectedStudentClass$ = this.studentDataFacade.selectedClass$;
  selectedFacultyClass$ = this.supervisorDataFacade.selectedClass$;
  studentLoads$ = this.studentDataFacade.studentLoads$;
  role$ = this.authFacade.role$;
  ngOnInit() {
    const key = sessionStorage.getItem('selectedClassKey');

    if (!key) {
      this.router.navigate(['/dashboard']);
      return;
    }

    combineLatest([
      this.authFacade.role$,
      this.authFacade.evaluatorId$,
      this.studentDataFacade.selectedClass$,
      this.supervisorDataFacade.selectedClassForEvaluation$,
      this.studentDataFacade.studentLoads$,
    ])
      .pipe(
        filter(([role, evaluatorId]) => !!role && !!evaluatorId),
        take(1),
      )
      .subscribe(([role, evaluatorId, studentClass, supervisorClass, loads]) => {
        if (role === 'ROLE_STUDENT') {
          if (!studentClass) {
            this.router.navigate(['/dashboard']);
            return;
          }
          if (!loads || loads.length === 0) {
            this.studentDataFacade.loadStudentLoads(evaluatorId!, 0, 10, 'desc');
          }
        } else if (role === 'ROLE_DEAN') {
          if (!supervisorClass) {
            this.router.navigate(['/dashboard']);
            return;
          }
          this.supervisorDataFacade.selectClass(supervisorClass);
        }
      });
  }
}
