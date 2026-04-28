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
  imports: [AsyncPipe, JsonPipe],
  templateUrl: './evaluation-form-component.html',
  styleUrl: './evaluation-form-component.css',
})
export class EvaluationFormComponent {
  private studentDataFacade = inject(StudentDataFacade);
  private router = inject(Router);
  private authFacade = inject(AuthFacade);
  private supervisorDataFacade = inject(SupervisorDataFacade);
  selectedClass$ = this.studentDataFacade.selectedClass$;
  studentLoads$ = this.studentDataFacade.studentLoads$;
  role$ = this.authFacade.role$;
  selectedSupervisorClass = this.supervisorDataFacade.selectedClass$;
  ngOnInit() {
  const key = sessionStorage.getItem('selectedClassKey');

  if (!key) {
    this.router.navigate(['/dashboard']);
    return;
  }

  combineLatest([
    this.authFacade.role$,
    this.authFacade.evaluatorId$
  ])
    .pipe(
      filter(([role, evaluatorId]) => !!role && !!evaluatorId),
      take(1)
    )
    .subscribe(([role, evaluatorId]) => {
      if (role === 'ROLE_STUDENT') {

        this.studentDataFacade.selectClassForEvaluation(key);
        combineLatest([
          this.selectedClass$,
          this.studentLoads$
        ])
          .pipe(take(1))
          .subscribe(([selectedClass, loads]) => {
            const isCacheEmpty = !loads || loads.length === 0;
            if (isCacheEmpty) {
              this.studentDataFacade.loadStudentLoads(
                evaluatorId!,
                0,
                10,
                'desc'
              );
              return;
            }
            if (!selectedClass) {
             alert(selectedClass);
            }
          });
      }
      else {
        const stored = sessionStorage.getItem('selectedClass');
        if (!stored) {
          this.router.navigate(['/dashboard']);
          return;
        }
        const selectedClass = JSON.parse(stored);
        this.supervisorDataFacade.selectClass(selectedClass);
        this.supervisorDataFacade.loadEvaluationStatus(
          `${selectedClass.college || 'CAS'}-ACTIVE`,
          role,
          {
            facultyId: selectedClass.facultyId,
            evaluatorId: evaluatorId!,
            classCode: selectedClass.classCode,
            semester: selectedClass.semester,
            schoolYear: selectedClass.schoolYear
          }
        );
      }
    });
}
}
