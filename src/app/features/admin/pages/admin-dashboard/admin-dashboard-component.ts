import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AdminDataFacade } from '@core/store/admin-data/admin-data.facade';
import { CommonModule } from '@angular/common';
import { SidebarLayoutComponent } from '@shared/layout/sidebar-layout-component/sidebar-layout-component';
import { HeaderLayoutComponent } from '@shared/layout/header-layout-component/header-layout-component';
import { RouterModule } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-admin-dashboard-component',
  imports: [
    CommonModule,
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
