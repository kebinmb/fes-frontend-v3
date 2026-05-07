import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { AdminDataFacade } from '../../../store/admin-data/admin-data.facade';
import { FetchFacultyResponse } from '../../../services/admin/admin-service';
import { debounceTime, Subject } from 'rxjs';

@Component({
  selector: 'app-faculty-data-table-component',
  standalone: true,
  imports: [AsyncPipe, ReactiveFormsModule, FormsModule],
  templateUrl: './faculty-data-table-component.html',
  styleUrl: './faculty-data-table-component.css',
})
export class FacultyDataTableComponent implements OnInit {
  private adminDataFacade = inject(AdminDataFacade);
  private fb = inject(FormBuilder);
  private searchSubject = new Subject<string>();
  faculties$ = this.adminDataFacade.faculties$;

  updateFacultyMessage$ = this.adminDataFacade.updateFacultyMessage$;

  selectedFaculty: FetchFacultyResponse | null = null;

  searchTerm = '';

  currentPage = 0;
  pageSize = 10;

  facultyForm: FormGroup = this.fb.group({
    facultyId: ['', Validators.required],

    firstname: ['', [Validators.required, Validators.minLength(2)]],

    middlename: [''],

    lastname: ['', [Validators.required, Validators.minLength(2)]],

    position: ['', Validators.required],

    loadLimit: [0, [Validators.required, Validators.min(1)]],

    college: ['', Validators.required],

    status: ['', Validators.required],
  });

  ngOnInit(): void {
    this.loadFaculties();

    this.searchSubject.pipe(debounceTime(400)).subscribe((value) => {
      this.searchTerm = value;

      this.currentPage = 0;

      this.loadFaculties();
    });
  }

  loadFaculties(): void {
    this.adminDataFacade.loadFaculties(this.currentPage, this.pageSize, this.searchTerm);
  }
  onSearchChange(value: string): void {
    this.searchSubject.next(value);
  }
  onSearch(): void {
    this.currentPage = 0;

    this.loadFaculties();
  }

  onFacultyPageChange(page: number): void {
    if (page < 0) {
      return;
    }

    this.currentPage = page;

    this.loadFaculties();
  }

  openEditModal(faculty: FetchFacultyResponse): void {
    this.selectedFaculty = faculty;

    this.facultyForm.patchValue({
      facultyId: faculty.facultyId,
      firstname: faculty.firstname,
      middlename: faculty.middlename,
      lastname: faculty.lastname,
      position: faculty.position,
      loadLimit: Number(faculty.loadLimit),
      college: faculty.college,
      status: faculty.status,
    });
  }

  closeEditModal(): void {
    this.selectedFaculty = null;

    this.facultyForm.reset();
  }

  updateFaculty(): void {
    if (this.facultyForm.invalid) {
      this.facultyForm.markAllAsTouched();

      return;
    }

    this.adminDataFacade.updateFaculty(this.facultyForm.value);

    this.closeEditModal();
  }

  get f() {
    return this.facultyForm.controls;
  }
}
