import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastComponent } from './shared/components/toast-component/toast-component';
import { SpinnerComponent } from './shared/components/spinner-component/spinner-component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet,ToastComponent,SpinnerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('fes-frontend-v3');
}
