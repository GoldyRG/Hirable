import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import {
  ApplicationStatus,
  JobApplication,
  ApplicationsReport,
  JobApplicationCreate,
  JobApplicationUpdate
} from '../../models/job-application.model';
import { JobApplicationsService } from '../../services/job-applications.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-job-applications-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './job-applications-list.component.html',
  styleUrls: ['./job-applications-list.component.css']
})
export class JobApplicationsListComponent implements OnInit {
  // list + report

  isTestMode = true;

  jobs: JobApplication[] = [];
  report: ApplicationsReport | null = null;

  // search
  searchQuery = '';
  searchLocation = '';
  searchStatus: ApplicationStatus | '' = '';

  isLoading = false;
  errorMessage = '';

  // expose enum to template
  ApplicationStatus = ApplicationStatus;

  // create form
  newApp: JobApplicationCreate = {
    companyName: '',
    jobTitle: '',
    status: ApplicationStatus.Applied,
    appliedOn: new Date().toISOString().substring(0, 10),
    location: '',
    minSalary: undefined,
    maxSalary: undefined,
    source: '',
    notes: ''
  };

  newAppError = '';

  // edit state (for modal)
  editingJobId: number | null = null;
  currentEditingJob: JobApplication | null = null;
  editApp: JobApplicationUpdate | null = null;
  editError = '';
  showEditModal = false;

  // summary report modal
  showReportModal = false;

  // notes modal
  showNoteModal = false;
  selectedNoteJob: JobApplication | null = null;

  isDemoMode = false;
  private lastAuthState: boolean | null = null;

  private readonly demoSeedJobs: JobApplication[] = [
    {
      id: 1001,
      companyName: 'Hirable',
      jobTitle: 'Software Engineer',
      status: ApplicationStatus.Applied,
      appliedOn: '2025-12-03',
      location: 'Remote',
      minSalary: 85000,
      maxSalary: 125000,
      source: 'Company Site',
      notes: 'Hi, I am excited to graduate this is my final task!'
    },
    {
      id: 1002,
      companyName: 'Progressive',
      jobTitle: 'Software Engineer',
      status: ApplicationStatus.Rejected,
      appliedOn: '2025-12-08',
      location: 'Remote',
      minSalary: 85000,
      maxSalary: 125000,
      source: 'Company Site',
      notes: ''
    },
    {
      id: 1003,
      companyName: 'Microsoft',
      jobTitle: 'Software Engineer',
      status: ApplicationStatus.PhoneScreen,
      appliedOn: '2025-12-05',
      location: 'Remote',
      minSalary: 100000,
      maxSalary: 200000,
      source: 'Referral',
      notes: ''
    }
  ];

  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  private toggleMode(isLoggedIn: boolean): void {
    if (this.lastAuthState === isLoggedIn) {
      return;
    }
    this.lastAuthState = isLoggedIn;

    if (isLoggedIn) {
      this.exitDemoMode();
      this.loadAll();
    } else {
      this.enterDemoMode();
    }
  }

  private validateSalaryRange(min?: number, max?: number): string | null {
    const minValue = min ?? undefined;
    const maxValue = max ?? undefined;

    if (minValue !== undefined && minValue < 0) {
      return 'Minimum salary cannot be negative.';
    }
    if (maxValue !== undefined && maxValue < 0) {
      return 'Maximum salary cannot be negative.';
    }
    if (minValue !== undefined && maxValue !== undefined && minValue > maxValue) {
      return 'Minimum salary cannot be greater than maximum salary.';
    }
    return null;
  }

  formatCurrency(value?: number | null): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    return this.currencyFormatter.format(value);
  }

  constructor(
    private jobAppsService: JobApplicationsService,
    private cdr: ChangeDetectorRef,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const isLoggedIn = this.auth.snapshot.isLoggedIn;
    this.toggleMode(isLoggedIn);

    this.auth.isLoggedIn$.subscribe(loggedIn => {
      this.toggleMode(loggedIn);
    });
  }

 
  getStatusLabel(status: ApplicationStatus): string {
    switch (status) {
      case ApplicationStatus.Applied:
        return 'Applied';
      case ApplicationStatus.PhoneScreen:
        return 'Phone Screen';
      case ApplicationStatus.Interview:
        return 'Interview';
      case ApplicationStatus.Offer:
        return 'Offer';
      case ApplicationStatus.Rejected:
        return 'Rejected';
      case ApplicationStatus.OnHold:
        return 'On Hold';
      default:
        return '' + status;
    }
  }

  toggleDemoMode(): void {
    if (this.isDemoMode) {
      this.exitDemoMode();
    } else {
      this.enterDemoMode();
    }
  }

  private enterDemoMode(): void {
    this.isDemoMode = true;
    this.isTestMode = true;
    this.errorMessage = '';
    this.isLoading = false;

    this.jobs = this.demoSeedJobs.map(j => ({ ...j }));
    this.buildDemoReport();

    this.cdr.detectChanges();
  }

  private exitDemoMode(): void {

    this.isDemoMode = false;
    this.isTestMode = false;
    this.jobs = [];
    this.report = null;
    this.showReportModal = false;
    this.showNoteModal = false;
    this.showEditModal = false;
    this.editApp = null;
    this.currentEditingJob = null;
    this.selectedNoteJob = null;

    this.loadAll(); 
  }

  private buildDemoReport(showModalOnSuccess: boolean = false): void {
    this.report = {
      title: 'Demo Applications Summary',
      generatedAt: new Date().toISOString(),
      rows: this.jobs.map(j => ({
        companyName: j.companyName,
        jobTitle: j.jobTitle,
        status: j.status,
        appliedOn: j.appliedOn,
        location: j.location
      }))
    };
    if (showModalOnSuccess) {
      this.showReportModal = true;
    }
  }


  loadAll(): void {

    if (this.isDemoMode) {
      this.enterDemoMode();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.jobAppsService.getAll().subscribe({
      next: apps => {
        this.jobs = apps;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Failed to load job applications.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch(): void {
    if (this.isDemoMode) {

      const q = this.searchQuery.toLowerCase().trim();
      const location = this.searchLocation.toLowerCase().trim();
      const statusFilter =
        this.searchStatus === '' ? undefined : (this.searchStatus as ApplicationStatus);

      this.jobs = this.demoSeedJobs
        .filter(j => {
          const matchesQuery =
            !q ||
            j.companyName.toLowerCase().includes(q) ||
            j.jobTitle.toLowerCase().includes(q);
          const matchesLocation =
            !location || (j.location ?? '').toLowerCase().includes(location);
          const matchesStatus =
            statusFilter === undefined || j.status === statusFilter;
          return matchesQuery && matchesLocation && matchesStatus;
        })
        .map(j => ({ ...j }));

      this.buildDemoReport();
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const statusFilter =
      this.searchStatus === '' ? undefined : (this.searchStatus as ApplicationStatus);

    this.jobAppsService
      .search(this.searchQuery, statusFilter, this.searchLocation)
      .subscribe({
        next: apps => {
          this.jobs = apps;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.errorMessage = 'Search failed.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchLocation = '';
    this.searchStatus = '';

    if (this.isDemoMode) {
 
      this.jobs = this.demoSeedJobs.map(j => ({ ...j }));
      this.buildDemoReport();
      this.cdr.detectChanges();
    } else {
      this.loadAll();
    }
  }

  loadReport(showModalOnSuccess: boolean = false): void {
    if (this.isDemoMode) {
      this.buildDemoReport(showModalOnSuccess);
      this.cdr.detectChanges();
      return;
    }

    this.jobAppsService.getSummaryReport().subscribe({
      next: report => {
        this.report = report;
        if (showModalOnSuccess) {
          this.showReportModal = true;
        }
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.cdr.detectChanges();
      }
    });
  }

  openSummaryReport(): void {
    if (this.report) {
      this.showReportModal = true;
      return;
    }

    this.loadReport(true);
  }

  closeReport(): void {
    this.showReportModal = false;
  }

  /* -------- NOTES MODAL -------- */

  openNote(job: JobApplication): void {
    this.selectedNoteJob = job;
    this.showNoteModal = true;
    this.cdr.markForCheck();
  }

  closeNoteModal(): void {
    this.showNoteModal = false;
    this.selectedNoteJob = null;
    this.cdr.markForCheck();
  }

  /* -------- EDIT MODAL -------- */

  startEdit(job: JobApplication): void {
    this.editError = '';
    this.currentEditingJob = job;
    this.editingJobId = job.id;

    const appliedOnStr =
      typeof job.appliedOn === 'string'
        ? job.appliedOn.substring(0, 10)
        : new Date(job.appliedOn as any).toISOString().substring(0, 10);

    this.editApp = {
      companyName: job.companyName,
      jobTitle: job.jobTitle,
      status: job.status,
      appliedOn: appliedOnStr,
      location: job.location,
      minSalary: job.minSalary ?? undefined,
      maxSalary: job.maxSalary ?? undefined,
      source: job.source,
      notes: job.notes
    };

    this.showEditModal = true;
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.showEditModal = false;
    this.editingJobId = null;
    this.currentEditingJob = null;
    this.editApp = null;
    this.editError = '';
    this.cdr.markForCheck();
  }

  saveEdit(): void {
    if (!this.editApp || !this.currentEditingJob) {
      return;
    }

    if (!this.editApp.companyName.trim() || !this.editApp.jobTitle.trim()) {
      this.editError = 'Company and Job Title are required when editing.';
      this.cdr.markForCheck();
      return;
    }

    const salaryError = this.validateSalaryRange(
      this.editApp.minSalary,
      this.editApp.maxSalary
    );
    if (salaryError) {
      this.editError = salaryError;
      this.cdr.markForCheck();
      return;
    }

    const updatedApp: JobApplication = {
      id: this.currentEditingJob.id,
      companyName: this.editApp.companyName,
      jobTitle: this.editApp.jobTitle,
      status: this.editApp.status,
      appliedOn: this.editApp.appliedOn,
      location: this.editApp.location,
      minSalary: this.editApp.minSalary ?? undefined,
      maxSalary: this.editApp.maxSalary ?? undefined,
      source: this.editApp.source,
      notes: this.editApp.notes
    };

    if (this.isDemoMode) {
    
      this.jobs = this.jobs.map(j =>
        j.id === updatedApp.id ? { ...updatedApp } : j
      );
      this.buildDemoReport();
      this.isLoading = false;
      this.showEditModal = false;
      this.editingJobId = null;
      this.currentEditingJob = null;
      this.editApp = null;
      this.cdr.markForCheck();
      return;
    }

    this.isLoading = true;
    this.editError = '';

    this.jobAppsService.update(updatedApp.id, updatedApp).subscribe({
      next: () => {
        this.jobs = this.jobs.map(j =>
          j.id === updatedApp.id ? updatedApp : j
        );

        this.isLoading = false;
        this.showEditModal = false;
        this.editingJobId = null;
        this.currentEditingJob = null;
        this.editApp = null;

        this.loadReport();
        this.cdr.markForCheck();
      },
      error: err => {
        console.error(err);
        this.editError = 'Failed to update job application.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  confirmDelete(job: JobApplication): void {
    const confirmed = window.confirm(
      `Delete job application "${job.companyName} - ${job.jobTitle}"?`
    );
    if (!confirmed) {
      return;
    }

    if (this.isDemoMode) {

      this.jobs = this.jobs.filter(j => j.id !== job.id);
      this.buildDemoReport();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;

    this.jobAppsService.delete(job.id).subscribe({
      next: () => {
        this.jobs = this.jobs.filter(j => j.id !== job.id);
        this.isLoading = false;
        this.loadReport();
        this.cdr.markForCheck();
      },
      error: err => {
        console.error(err);
        this.errorMessage = 'Failed to delete job application.';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /* -------- CREATE FORM -------- */

  resetNewApp(): void {
    this.newApp = {
      companyName: '',
      jobTitle: '',
      status: ApplicationStatus.Applied,
      appliedOn: new Date().toISOString().substring(0, 10),
      location: '',
      minSalary: undefined,
      maxSalary: undefined,
      source: '',
      notes: ''
    };
    this.newAppError = '';
  }

  onCreate(): void {
    this.newAppError = '';

    if (!this.newApp.companyName.trim() || !this.newApp.jobTitle.trim()) {
      this.newAppError = 'Company and Job Title are required.';
      this.cdr.detectChanges();
      return;
    }

    const salaryError = this.validateSalaryRange(
      this.newApp.minSalary,
      this.newApp.maxSalary
    );
    if (salaryError) {
      this.newAppError = salaryError;
      this.cdr.detectChanges();
      return;
    }

    if (this.isDemoMode) {
      // local-only add in demo mode
      const newId = Date.now(); // simple unique id for demo
      const created: JobApplication = {
        id: newId,
        companyName: this.newApp.companyName,
        jobTitle: this.newApp.jobTitle,
        status: this.newApp.status,
        appliedOn: this.newApp.appliedOn,
        location: this.newApp.location,
        minSalary: this.newApp.minSalary ?? undefined,
        maxSalary: this.newApp.maxSalary ?? undefined,
        source: this.newApp.source,
        notes: this.newApp.notes
      };

      this.jobs = [created, ...this.jobs];
      this.buildDemoReport();
      this.resetNewApp();
      this.cdr.detectChanges();
      return;
    }

    this.isLoading = true;

    this.jobAppsService.create(this.newApp).subscribe({
      next: created => {
        this.jobs = [created, ...this.jobs];
        this.loadReport();
        this.resetNewApp();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: err => {
        console.error(err);
        this.newAppError = 'Failed to create job application.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}
