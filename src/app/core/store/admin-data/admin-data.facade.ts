import { inject, Injectable } from '@angular/core';
import * as AdminDataSelectors from './admin-data.selectors';
import * as AdminDataActions from './admin-data.actions';
import { Store } from '@ngrx/store';
import {
  CreateUserAccountRequest,
  UpdateFacultyRequest,
  UpdateUserAccountRequest,
  UpdateUserPasswordRequest,
} from '../../services/admin/admin-service';
@Injectable({ providedIn: 'root' })
export class AdminDataFacade {
  private store = inject(Store);

  faculties$ = this.store.select(AdminDataSelectors.selectFaculties);
  userAccounts$ = this.store.select(AdminDataSelectors.selectUserAccounts);
  facultyEvaluationScores$ = this.store.select(AdminDataSelectors.selectFacultyEvaluationScores);
  loading$ = this.store.select(AdminDataSelectors.selectLoading);
  updateFacultyMessage$ = this.store.select(AdminDataSelectors.selectUpdateFacultyMessage);
  studentSections$ = this.store.select(AdminDataSelectors.selectStudentSections);
  facultyEvaluationScoresByFacultyId$ = this.store.select(
    AdminDataSelectors.selectFacultyEvaluationScoresByFacultyId,
  );
  createUserAccountMessage$ = this.store.select(AdminDataSelectors.selectCreateUserAccountMessage);

  updateUserAccountMessage$ = this.store.select(AdminDataSelectors.selectUpdateUserAccountMessage);

  updateUserPasswordMessage$ = this.store.select(
    AdminDataSelectors.selectUpdateUserPasswordMessage,
  );
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
  loadFacultyEvaluationScoresByFacultyId(facultyId: string): void {
    this.store.dispatch(
      AdminDataActions.loadFacultyEvaluationScoresByFacultyId({
        facultyId,
      }),
    );
  }
  updateFaculty(payload: UpdateFacultyRequest) {
    this.store.dispatch(AdminDataActions.updateFaculty({ payload }));
  }
  createUserAccount(payload: CreateUserAccountRequest): void {
    this.store.dispatch(
      AdminDataActions.createUserAccount({
        payload,
      }),
    );
  }
  updateUserAccount(payload: UpdateUserAccountRequest): void {
    this.store.dispatch(
      AdminDataActions.updateUserAccount({
        payload,
      }),
    );
  }
  updateUserPassword(payload: UpdateUserPasswordRequest): void {
    this.store.dispatch(
      AdminDataActions.updateUserPassword({
        payload,
      }),
    );
  }
  loadStudentSections(
    page: number,
    size: number,
    programCode?: string,
    yearLevel?: string,
    sectionCode?: string,
  ): void {
    this.store.dispatch(
      AdminDataActions.loadStudentSections({
        page,
        size,
        programCode,
        yearLevel,
        sectionCode,
      }),
    );
  }
}
