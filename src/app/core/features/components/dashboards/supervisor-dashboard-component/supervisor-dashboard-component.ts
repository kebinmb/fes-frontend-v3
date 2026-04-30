import { Component, inject } from '@angular/core';
import {
  FacultyDashboardVM,
  SupervisorDataFacade,
} from '../../../../store/supervisor-data/supervisor-data.facade';
import { AsyncPipe, CommonModule } from '@angular/common';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { AuthFacade } from '../../../../store/auth/auth.facade';
import {
  FacultyDTO,
  FacultyClass,
} from '../../../../services/supervisor-data/supervisor-data-service';
type ClassVM = {
  subjectCode?: string;
  programCode?: string;
  yearLevel?: number;
  sectionCode?: string;
  isEvaluated: boolean;
};
@Component({
  selector: 'app-supervisor-dashboard-component',
  standalone: true,
  imports: [AsyncPipe, CommonModule],
  templateUrl: './supervisor-dashboard-component.html',
  styleUrl: './supervisor-dashboard-component.css',
})
export class SupervisorDashboardComponent {
  private supervisorDataFacade = inject(SupervisorDataFacade);
  private authFacade = inject(AuthFacade);
  college = sessionStorage.getItem('college') ?? '';
  status = 'ACTIVE';
  key = `${this.college}-${this.status}`;
  faculties$ = this.supervisorDataFacade.faculties$(this.key);
  facultiesLoading$ = this.supervisorDataFacade.facultiesLoading$(this.key);
  evaluatorId$ = this.authFacade.evaluatorId$;
  facultyDashboard$: Observable<FacultyDashboardVM[]> = this.supervisorDataFacade.facultyDashboard$(
    this.key,
  );
  loaded$ = combineLatest([this.faculties$, this.facultiesLoading$]).pipe(
    map(([faculties, loading]) => !loading && faculties.length > 0),
  );
  collegeFaculties$ = this.faculties$;
  totalClassesCount$ = this.facultyDashboard$.pipe(
    map((list) => list.reduce((sum, f) => sum + f.classes.length, 0)),
  );
  completedEvaluationsCount$ = this.facultyDashboard$.pipe(
    map((list) => list.reduce((sum, f) => sum + f.classes.filter((c) => c.isEvaluated).length, 0)),
  );
  isLoading$ = this.facultiesLoading$;
  pendingCount$ = combineLatest([this.totalClassesCount$, this.completedEvaluationsCount$]).pipe(
    map(([total = 0, completed = 0]) => total - completed),
  );
  ngOnInit(): void {
    this.supervisorDataFacade.loadFaculties(this.key, this.college, this.status);
  }
  schoolYear() {
    return new Date().getFullYear();
  }
  semester() {
    return '1st';
  }
  onFacultyClick(faculty: any) {
    console.log('Faculty clicked:', faculty);
  }
  startEvaluation(cls: FacultyClass, faculty: FacultyDTO, event: Event) {
    event.stopPropagation();

    const key = `${faculty.facultyId}-${cls.classCode}-${cls.semester}-${cls.schoolYear}`;

    const facultyName = `${faculty.firstname} ${faculty.lastname}`;

    this.supervisorDataFacade.selectClass({
      ...cls,
      facultyId: faculty.facultyId,
      facultyName,
    });

    console.log('Evaluate:', { key, cls, faculty });
  }
  getButtonLabel(cls: ClassVM): string {
    if (cls.isEvaluated) return 'Done';

    const parts = [cls.subjectCode, cls.programCode, cls.yearLevel, cls.sectionCode].filter(
      Boolean,
    );

    return `${parts.join(' ')} - Evaluate`;
  }
  logout() {
    this.authFacade.logout();
  }
}
