export enum ApplicationStatus {
  Applied = 0,
  PhoneScreen = 1,
  Interview = 2,
  Offer = 3,
  Rejected = 4,
  OnHold = 5
}

export interface JobApplication {
  id: number;
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedOn: string;
  location: string;
  minSalary?: number;
  maxSalary?: number;
  source: string;
  notes: string;
}

export interface ApplicationsReportRow {
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedOn: string;
  location: string;
}

export interface ApplicationsReport {
  title: string;
  generatedAt: string;
  rows: ApplicationsReportRow[];
}

export interface JobApplicationCreate {
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedOn: string; // ISO date string, e.g. '2025-12-07'
  location: string;
  minSalary?: number;
  maxSalary?: number;
  source: string;
  notes: string;
}

export interface JobApplicationUpdate {
  companyName: string;
  jobTitle: string;
  status: ApplicationStatus;
  appliedOn: string; // 'YYYY-MM-DD'
  location: string;
  minSalary?: number;
  maxSalary?: number;
  source: string;
  notes: string;
}
