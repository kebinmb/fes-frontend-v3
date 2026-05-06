import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-user-accounts-data-table-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-accounts-data-table-component.html',
  styleUrl: './user-accounts-data-table-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserAccountsDataTableComponent {

  userAccounts =
    input<any | null>(null);

  loading =
    input<boolean | null>(false);

  pageChange =
    output<number>();

  onUserPageChange(page: number): void {

    if (page < 0) {
      return;
    }

    this.pageChange.emit(page);
  }
}