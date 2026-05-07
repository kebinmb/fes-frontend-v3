import { Component, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { SidebarService } from '../../../core/services/layout/sidebar/sidebar-service';

@Component({
  selector: 'app-sidebar-layout-component',
  imports: [RouterModule],
  templateUrl: './sidebar-layout-component.html',
  styleUrl: './sidebar-layout-component.css',
})
export class SidebarLayoutComponent {
  sidebarService = inject(SidebarService);

  closeSidebar(): void {
    this.sidebarService.closeSidebar();
  }
}
