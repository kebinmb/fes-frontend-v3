import { AsyncPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { AdminDataFacade } from '../../../store/admin-data/admin-data.facade';

@Component({
  selector: 'app-faculty-evaluation-scores-data-table-component',
  imports: [DecimalPipe, AsyncPipe],
  templateUrl: './faculty-evaluation-scores-data-table-component.html',
  styleUrl: './faculty-evaluation-scores-data-table-component.css',
})
export class FacultyEvaluationScoresDataTableComponent {
  private adminDataFacade = inject(AdminDataFacade);
  facultyEvaluationScore$ = this.adminDataFacade.facultyEvaluationScores$;
  ngOnInit(): void {
    this.adminDataFacade.loadFacultyEvaluationScores(0, 10);
  }
  onUserPageChange(page: number): void {
    if (page < 0) {
      return;
    }
    this.adminDataFacade.loadFacultyEvaluationScores(page, 10);
  }
}
