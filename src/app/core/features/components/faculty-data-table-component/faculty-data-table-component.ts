import { Component, inject, OnInit } from '@angular/core';
import { AdminDataFacade } from '../../../store/admin-data/admin-data.facade';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-faculty-data-table-component',
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: './faculty-data-table-component.html',
  styleUrl: './faculty-data-table-component.css',
})
export class FacultyDataTableComponent implements OnInit {
  private adminDataFacade = inject(AdminDataFacade);
  faculties$ = this.adminDataFacade.faculties$;
  ngOnInit(): void {
    this.adminDataFacade.loadFaculties(0, 10);
  }
  onFacultyPageChange(page: number): void {
    if (page < 0) {
      return;
    }
    this.adminDataFacade.loadFaculties(page, 10);
  }
}
