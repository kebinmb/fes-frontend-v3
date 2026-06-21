import { AsyncPipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { take } from 'rxjs';
import { AdminDataFacade } from '@core/store/admin-data/admin-data.facade';
import { Actions, ofType } from '@ngrx/effects';

@Component({
  selector: 'app-faculty-evaluation-scores-data-table-component',
  standalone: true,
  imports: [DecimalPipe, AsyncPipe],
  templateUrl: './faculty-evaluation-scores-data-table-component.html',
  styleUrl: './faculty-evaluation-scores-data-table-component.css',
})
export class FacultyEvaluationScoresDataTableComponent implements OnInit {
  private adminDataFacade = inject(AdminDataFacade);
  facultyEvaluationScore$ = this.adminDataFacade.facultyEvaluationScores$;
  facultyEvaluationScoresByFacultyId$ = this.adminDataFacade.facultyEvaluationScoresByFacultyId$;
  ngOnInit(): void {
    this.adminDataFacade.loadFacultyEvaluationScores(0, 10);
  }
  onUserPageChange(page: number): void {
    if (page < 0) {
      return;
    }
    this.adminDataFacade.loadFacultyEvaluationScores(page, 10);
  }
  printSingle(score:any){

  }
  printBulk(data:any){

  }
}
