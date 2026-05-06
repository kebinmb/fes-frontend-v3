import { Component, inject } from '@angular/core';
import { AdminDataFacade } from '../../../../store/admin-data/admin-data.facade';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FacultyDataTableComponent } from '../../faculty-data-table-component/faculty-data-table-component';
import { UserAccountsDataTableComponent } from '../../user-accounts-data-table-component/user-accounts-data-table-component';
import { FacultyEvaluationScoresDataTableComponent } from '../../faculty-evaluation-scores-data-table-component/faculty-evaluation-scores-data-table-component';
import { SidebarLayoutComponent } from '../../../../../shared/layout/sidebar-layout-component/sidebar-layout-component';
import { HeaderLayoutComponent } from '../../../../../shared/layout/header-layout-component/header-layout-component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-dashboard-component',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    SidebarLayoutComponent,
    HeaderLayoutComponent,
    RouterModule,
  ],
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
    this.changePage(0);
    this.loadAll();
  }
  loadAll() {
    this.adminDataFacade.loadFaculties(this.facultyPage, this.pageSize);
    this.adminDataFacade.loadUserAccounts(this.userPage, this.pageSize);
    this.adminDataFacade.loadFacultyEvaluationScores(this.scorePage, this.pageSize);
  }
  changePage(page: number): void {
    this.adminDataFacade.loadFaculties(page, 10);
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
