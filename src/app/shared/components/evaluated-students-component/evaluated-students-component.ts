import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AsyncPipe, DatePipe } from '@angular/common';

import { debounceTime, distinctUntilChanged, Subject, take } from 'rxjs';
import { SupervisorDataFacade } from '../../../core/store/supervisor-data/supervisor-data.facade';
import { AuthFacade } from '../../../core/store/auth/auth.facade';
import { Store } from '@ngrx/store';
import { selectEvaluatorId } from '../../../core/store/auth/auth.selector';
import { UnicodeTextPipe } from '@shared/pipes/unicode-text.pipe';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-evaluated-students-component',

  standalone: true,

  imports: [AsyncPipe, DatePipe, UnicodeTextPipe],

  templateUrl: './evaluated-students-component.html',

  styleUrl: './evaluated-students-component.css',
})
export class EvaluatedStudentsComponent implements OnInit {
  private facade = inject(SupervisorDataFacade);
  private authfacade = inject(AuthFacade);
  private store = inject(Store);
  private destroyRef = inject(DestroyRef);
  readonly key = 'evaluated-students';
  evaluatorId$ = this.store.select(selectEvaluatorId);
  private searchSubject = new Subject<string>();

  page = 0;

  size = 10;

  sort = 'createdAt,desc';

  search = '';

  students$ = this.facade.evaluatedStudents$(this.key);

  pagination$ = this.facade.evaluatedStudentsPagination$(this.key);

  loading$ = this.facade.evaluatedStudentsLoading$(this.key);

  ngOnInit(): void {
    this.load();

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.search = value;

        this.page = 0;

        this.load();
      });
  }

  load(): void {
    this.authfacade.evaluatorId$
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((userId) => {
        if (!userId) {
          return;
        }

        this.facade.loadEvaluatedStudents(
          this.key,

          userId,

          this.page,

          this.size,

          this.sort,

          this.search,
        );
      });
  }

  onSearch(value: string): void {
    this.searchSubject.next(value);
  }

  nextPage(): void {
    this.page++;

    this.load();
  }

  previousPage(): void {
    if (this.page > 0) {
      this.page--;

      this.load();
    }
  }
  normalize(id: string): string {
    if (!id) {
      return '';
    }

    return id
      .replace(/^ALI-/i, '')
      .replace(/^TAL-/i, '')
      .replace(/^BIN-/i, '')
      .replace(/^FT-/i, '');
  }
}
