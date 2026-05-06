import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

@Component({
  selector: 'app-faculty-data-table-component',
  standalone: true,
  templateUrl: './faculty-data-table-component.html',
  styleUrl: './faculty-data-table-component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FacultyDataTableComponent {

  faculties = input<any | null>(null);

  loading = input<boolean | null>(false);

  pageChange = output<number>();

  onFacultyPageChange(page: number): void {

    if (page < 0) {
      return;
    }

    this.pageChange.emit(page);
  }
}