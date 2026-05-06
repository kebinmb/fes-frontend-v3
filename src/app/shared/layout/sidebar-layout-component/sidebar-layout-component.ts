import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar-layout-component',
  imports: [RouterModule],
  templateUrl: './sidebar-layout-component.html',
  styleUrl: './sidebar-layout-component.css',
})
export class SidebarLayoutComponent {
  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}
