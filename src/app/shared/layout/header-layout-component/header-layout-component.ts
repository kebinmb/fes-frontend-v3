import { Component } from '@angular/core';

@Component({
  selector: 'app-header-layout-component',
  imports: [],
  templateUrl: './header-layout-component.html',
  styleUrl: './header-layout-component.css',
})
export class HeaderLayoutComponent {
  sidebarOpen = false;

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }
}
