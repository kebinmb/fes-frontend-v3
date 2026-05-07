import { Component, inject } from '@angular/core';
import { AdminDataFacade } from '../../../store/admin-data/admin-data.facade';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-user-accounts-data-table-component',
  imports: [AsyncPipe],
  templateUrl: './user-accounts-data-table-component.html',
  styleUrl: './user-accounts-data-table-component.css',
})
export class UserAccountsDataTableComponent {
  private adminDataFacade = inject(AdminDataFacade);
  userAccounts$ = this.adminDataFacade.userAccounts$;
  ngOnInit(): void {
    this.adminDataFacade.loadUserAccounts(0, 10);
  }
  onUserPageChange(page: number): void {
    if (page < 0) {
      return;
    }
    this.adminDataFacade.loadUserAccounts(page, 10);
  }
}
