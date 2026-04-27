import { Component, inject } from '@angular/core';
import { FacultyDashboardVM, SupervisorDataFacade } from '../../../../store/supervisor-data/supervisor-data.facade';
import { AsyncPipe, CommonModule } from '@angular/common';
import { combineLatest, map, Observable, tap } from 'rxjs';
import { AuthFacade } from '../../../../store/auth/auth.facade';
import { FacultyDTO, FacultyClass } from '../../../../services/supervisor-data/supervisor-data-service';
@Component({
  selector: 'app-supervisor-dashboard-component',
  standalone: true,
  imports: [AsyncPipe, CommonModule],
  templateUrl: './supervisor-dashboard-component.html',
  styleUrl: './supervisor-dashboard-component.css',
})
export class SupervisorDashboardComponent {
  private facade = inject(SupervisorDataFacade);
  private authFacade = inject(AuthFacade);
  college = sessionStorage.getItem('college') ?? '';
  status = 'ACTIVE';
  key = `${this.college}-${this.status}`;
  faculties$ = this.facade.faculties$(this.key);
  facultiesLoading$ = this.facade.facultiesLoading$(this.key);

  facultyDashboard$: Observable<FacultyDashboardVM[]> =
    this.facade.facultyDashboard$(this.key);
  loadClasses$ = this.faculties$.pipe(
    tap(faculties => {
      faculties.forEach(f =>
        this.facade.loadFacultyClasses(this.key, f.facultyId)
      );
    })
  );
  loaded$ = combineLatest([
    this.faculties$,
    this.facultiesLoading$
  ]).pipe(
    map(([faculties, loading]) => !loading && faculties.length > 0)
  );
  collegeFaculties$ = this.faculties$;
  totalClassesCount$ = this.facultyDashboard$.pipe(
    map(list => list.reduce((sum, f) => sum + f.classes.length, 0))
  );
  completedEvaluationsCount$ = this.facultyDashboard$.pipe(
    map(list =>
      list.reduce(
        (sum, f) =>
          sum + f.classes.filter(c => c.isEvaluated).length,
        0
      )
    )
  );
  isLoading$ = this.facultiesLoading$;
  pendingCount$ = combineLatest([
    this.totalClassesCount$,
    this.completedEvaluationsCount$
  ]).pipe(
    map(([total = 0, completed = 0]) => total - completed)
  );
  ngOnInit(): void {
    this.facade.loadFaculties(this.key, this.college, this.status);
    this.loadClasses$.subscribe();
  }
  supervisorId() {
    return '1'; 
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
  onEvaluateClick(cls: any, faculty: any, event: Event) {
    event.stopPropagation();
    console.log('Evaluate:', cls, faculty);
  }
  getButtonLabel(cls: any) {
    return cls.isEvaluated ? 'Done' : 'Evaluate';
  }
  logout() {
    console.log('logout');
  }
}