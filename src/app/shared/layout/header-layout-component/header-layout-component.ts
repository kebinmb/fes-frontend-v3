import { Component, inject } from '@angular/core';
import { AuthFacade } from '../../../core/store/auth/auth.facade';
import { SidebarService } from '../../../core/services/layout/sidebar/sidebar-service';

@Component({
  selector: 'app-header-layout-component',
  imports: [],
  templateUrl: './header-layout-component.html',
  styleUrl: './header-layout-component.css',
})
export class HeaderLayoutComponent {
  private authFacade = inject(AuthFacade);

  sidebarOpen = false;

  sidebarService = inject(SidebarService);

  onLogout(): void {
    this.authFacade.logout();
  }

  toggleSidebar(): void {
    this.sidebarService.toggleSidebar();
  }
}
