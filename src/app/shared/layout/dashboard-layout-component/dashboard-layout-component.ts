import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-dashboard-layout-component',
  imports: [RouterOutlet],
  templateUrl: './dashboard-layout-component.html',
  styleUrl: './dashboard-layout-component.css',
})
export class DashboardLayoutComponent {
}
