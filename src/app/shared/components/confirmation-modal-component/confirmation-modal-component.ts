import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmation-modal-component',
  imports: [CommonModule],
  templateUrl: './confirmation-modal-component.html',
  styleUrl: './confirmation-modal-component.css',
})
export class ConfirmationModalComponent {

  @Input() visible = false;

  @Input() title =
    'Confirm Action';

  @Input() subtitle =
    '';

  @Input() message =
    '';

  @Input() confirmText =
    'Confirm';

  @Input() cancelText =
    'Cancel';

  @Input() faculty: any;

  @Output() confirmed =
    new EventEmitter<void>();

  @Output() closed =
    new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEscape(): void {

    if (this.visible) {

      this.close();

    }

  }

  confirm(): void {

    this.confirmed.emit();

  }

  close(): void {

    this.closed.emit();

  }

  get titleId(): string {

    return `confirmation-title-${this.title.replace(/\s+/g, '-').toLowerCase()}`;

  }
}
