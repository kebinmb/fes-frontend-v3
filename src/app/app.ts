import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast-component/toast-component';
import { SpinnerComponent } from './shared/components/spinner-component/spinner-component';
import { PatchNotesComponent } from './shared/components/patch-notes-component/patch-notes-component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [RouterOutlet, ToastComponent, SpinnerComponent, PatchNotesComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fes-frontend-v3');
}
