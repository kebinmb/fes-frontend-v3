import { Component, inject } from '@angular/core';
import { StudentDataFacade } from '../../../store/student-data/student-data.facade';
import { AsyncPipe, JsonPipe } from '@angular/common';
import { Router } from '@angular/router';
import { combineLatest, filter, take } from 'rxjs';
import { AuthFacade } from '../../../store/auth/auth.facade';

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
  selectedClass$ = this.studentDataFacade.selectedClass$;
  studentLoads$ = this.studentDataFacade.studentLoads$;
  ngOnInit() {
    const key = sessionStorage.getItem('selectedClassKey');
    if (!key) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.studentDataFacade.selectClassForEvaluation(key);
    combineLatest([this.selectedClass$, this.studentLoads$, this.authFacade.evaluatorId$])
      .pipe(filter(([_, __, evaluatorId]) => !!evaluatorId))
      .subscribe(([selectedClass, loads, evaluatorId]) => {
        const isCacheEmpty = !loads || loads.length === 0;
        if (isCacheEmpty) {
          this.studentDataFacade.loadStudentLoads(evaluatorId!, 0, 10, 'desc');
          return;
        }
        if (!selectedClass) {
          this.router.navigate(['/dashboard']);
        }
      });
  }
}
