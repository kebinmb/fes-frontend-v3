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
  loading$ = this.adminDataFacade.loading$;
}
