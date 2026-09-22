import { ChangeDetectionStrategy, Component, inject, Input, SimpleChanges } from '@angular/core';
import { AdminDataFacade } from '../../../core/store/admin-data/admin-data.facade';
import { AsyncPipe, DatePipe } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-student-evaluation-list-print-component',
  imports: [DatePipe],
  templateUrl: './student-evaluation-list-print-component.html',
  styleUrl: './student-evaluation-list-print-component.css',
})
export class StudentEvaluationListPrintComponent {
  records: any[] = [];

  today = new Date();
  ngOnInit(): void {
    const rawData = localStorage.getItem('student-evaluation-print-data');
    localStorage.removeItem('student-evaluation-print-data');

    if (rawData) {
      this.records = JSON.parse(rawData);

      setTimeout(() => {
        window.print();
      }, 500);
    }
  }
}
