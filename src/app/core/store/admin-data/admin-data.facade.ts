import { inject, Injectable } from '@angular/core';
import * as AdminDataSelectors from './admin-data.selectors';
import * as AdminDataActions from './admin-data.actions';
import { Store } from '@ngrx/store';
import { UpdateFacultyRequest } from '../../services/admin/admin-service';
@Injectable({ providedIn: 'root' })
export class AdminDataFacade {
  private store = inject(Store);

  faculties$ = this.store.select(AdminDataSelectors.selectFaculties);
  userAccounts$ = this.store.select(AdminDataSelectors.selectUserAccounts);
  facultyEvaluationScores$ = this.store.select(AdminDataSelectors.selectFacultyEvaluationScores);
  loading$ = this.store.select(AdminDataSelectors.selectLoading);
  updateFacultyMessage$ = this.store.select(AdminDataSelectors.selectUpdateFacultyMessage);
  loadFaculties(page: number, size: number, search: string = ''): void {
    this.store.dispatch(
      AdminDataActions.loadFaculties({
        page,
        size,
        search,
      }),
    );
  }

  loadUserAccounts(page: number, size: number) {
    this.store.dispatch(AdminDataActions.loadUserAccounts({ page, size }));
  }

  loadFacultyEvaluationScores(page: number, size: number) {
    this.store.dispatch(AdminDataActions.loadFacultyEvaluationScores({ page, size }));
  }
  updateFaculty(payload: UpdateFacultyRequest) {
    this.store.dispatch(AdminDataActions.updateFaculty({ payload }));
  }
}
