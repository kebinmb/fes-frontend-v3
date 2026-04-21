import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { SpinnerFacade } from '../../../core/store/spinner/spinner.facade';

@Component({
  selector: 'app-spinner-component',
  imports: [CommonModule],
  templateUrl: './spinner-component.html',
  styleUrl: './spinner-component.css',
})
export class SpinnerComponent {
  private spinnerFacade = inject(SpinnerFacade);
  loading$ = this.spinnerFacade.loading$;
}
