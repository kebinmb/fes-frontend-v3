import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastFacade } from '../../../core/store/toast/toast.facade';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-toast-component',
  imports: [CommonModule],
  templateUrl: './toast-component.html',
  styleUrl: './toast-component.css',
})
export class ToastComponent {
  private toastFacade = inject(ToastFacade);
  toasts$ = this.toastFacade.toast$;
  remove(id: string) {
    this.toastFacade.removeToast(id);
  }
}
