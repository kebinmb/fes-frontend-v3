import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-faculty-evaluation-scores-data-table-component',
  imports: [DecimalPipe],
  templateUrl: './faculty-evaluation-scores-data-table-component.html',
  styleUrl: './faculty-evaluation-scores-data-table-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacultyEvaluationScoresDataTableComponent {
  facultyEvaluationScore = input<any | null>(null);

  loading = input<boolean | null>(false);

  pageChange = output<number>();

  onScorePageChange(page: number): void {
    if (page < 0) {
      return;
    }

    this.pageChange.emit(page);
  }
}
