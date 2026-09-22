import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthFacade } from '@core/store/auth/auth.facade';
import { SidebarService } from '../../../core/services/layout/sidebar/sidebar-service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-sidebar-layout-component',
  imports: [RouterModule, AsyncPipe],
  templateUrl: './sidebar-layout-component.html',
  styleUrl: './sidebar-layout-component.css',
})
export class SidebarLayoutComponent {
  sidebarService = inject(SidebarService);
  private authFacade = inject(AuthFacade);

  role$ = this.authFacade.role$;

  closeSidebar(): void {
    this.sidebarService.closeSidebar();
  }
}
