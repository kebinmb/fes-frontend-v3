import { Component, inject } from '@angular/core';
import { AdminDataFacade } from '../../../../store/admin-data/admin-data.facade';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-dashboard-component',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard-component.html',
  styleUrl: './admin-dashboard-component.css',
})
export class AdminDashboardComponent {
  private adminDataFacade = inject(AdminDataFacade);
  faculties$ = this.adminDataFacade.faculties$;
  userAccounts$ = this.adminDataFacade.userAccounts$;
  facultyEvaluationScores$ = this.adminDataFacade.facultyEvaluationScores$;
  loading$ = this.adminDataFacade.loading$;
  facultyPage = 0;
  userPage = 0;
  scorePage = 0;

  pageSize = 10;
  ngOnInit() {
    this.loadAll();
  }
  loadAll() {
    this.adminDataFacade.loadFaculties(this.facultyPage, this.pageSize);
    this.adminDataFacade.loadUserAccounts(this.userPage, this.pageSize);
    this.adminDataFacade.loadFacultyEvaluationScores(this.scorePage, this.pageSize);
  }
  onFacultyPageChange(page: number) {
    this.adminDataFacade.loadFaculties(page, 10);
  }

  onUserPageChange(page: number) {
    this.adminDataFacade.loadUserAccounts(page, 10);
  }

  onScorePageChange(page: number) {
    this.adminDataFacade.loadFacultyEvaluationScores(page, 10);
  }
}
