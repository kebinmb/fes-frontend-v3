import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { LATEST_RELEASE_NOTE } from '@core/config/changelog';

@Component({
  selector: 'app-patch-notes-component',
  imports: [CommonModule],
  templateUrl: './patch-notes-component.html',
  styleUrl: './patch-notes-component.css',
})
export class PatchNotesComponent implements OnInit {
  readonly release = LATEST_RELEASE_NOTE;
  visible = false;

  private readonly storageKey = `fes.patchNotes.seen.${this.release.version}`;

  ngOnInit(): void {
    if (!this.canUseLocalStorage()) {
      return;
    }

    this.visible = localStorage.getItem(this.storageKey) !== 'true';
  }

  dismiss(): void {
    if (this.canUseLocalStorage()) {
      localStorage.setItem(this.storageKey, 'true');
    }

    this.visible = false;
  }

  remindLater(): void {
    this.visible = false;
  }

  private canUseLocalStorage(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
