import { Component, inject } from '@angular/core';
import { SupervisorDataFacade } from '../../../../store/supervisor-data/supervisor-data.facade';
import { AsyncPipe, CommonModule, JsonPipe } from '@angular/common';
import { Observable } from 'rxjs';
import { FacultyDTO } from '../../../../services/supervisor-data/supervisor-data-service';
import { AuthFacade } from '../../../../store/auth/auth.facade';

@Component({
  selector: 'app-supervisor-dashboard-component',
  imports: [AsyncPipe, JsonPipe, CommonModule],
  templateUrl: './supervisor-dashboard-component.html',
  styleUrl: './supervisor-dashboard-component.css',
})
export class SupervisorDashboardComponent {
  private supervisorDataFacade = inject(SupervisorDataFacade);
  private authFacade = inject(AuthFacade);
  faculties$!: Observable<FacultyDTO[]>;
  loading$!: Observable<boolean>;
  error$!: Observable<any>;

  college = sessionStorage.getItem('college') ?? '';
  status = 'ACTIVE';
  key = `${this.college}-${this.status}`;
  ngOnInit(): void {
    this.supervisorDataFacade.loadFaculties(this.key, this.college, this.status);
    this.faculties$ = this.supervisorDataFacade.faculties$(this.key);
    this.loading$ = this.supervisorDataFacade.facultiesLoading$(this.key);
    this.error$ = this.supervisorDataFacade.facultiesError$(this.key);
  }
}
