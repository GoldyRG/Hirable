import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import {
  JobApplication,
  ApplicationStatus,
  ApplicationsReport,
  JobApplicationCreate,
  JobApplicationUpdate
} from '../models/job-application.model';
import { environment } from '../../environment';

@Injectable({
  providedIn: 'root'
})
export class JobApplicationsService {

  private readonly apiBaseUrl = `${environment.apiBaseUrl}/jobapplications`;

  constructor(private http: HttpClient, private auth: AuthService) {}

  /** Get all job applications */
  getAll(): Observable<JobApplication[]> {
    return this.http.get<JobApplication[]>(this.apiBaseUrl, {
      headers: this.auth.authHeaders()
    });
  }

  /** Search job applications by query, status, and/or location */
  search(
    query?: string,
    status?: ApplicationStatus,
    location?: string
  ): Observable<JobApplication[]> {
    let params = new HttpParams();

    if (query) {
      params = params.set('query', query);
    }

    if (status !== undefined && status !== null) {
      params = params.set('status', status.toString());
    }

    if (location) {
      params = params.set('location', location);
    }

    return this.http.get<JobApplication[]>(`${this.apiBaseUrl}/search`, {
      params,
      headers: this.auth.authHeaders()
    });
  }

  /** Get the summary report */
  getSummaryReport(): Observable<ApplicationsReport> {
    return this.http.get<ApplicationsReport>(
      `${this.apiBaseUrl}/report/summary`,
      { headers: this.auth.authHeaders() }
    );
  }

  /** Create a new job application */
  create(app: Omit<JobApplicationCreate, 'id'>): Observable<JobApplication> {
    return this.http.post<JobApplication>(this.apiBaseUrl, app, {
      headers: this.auth.authHeaders()
    });
  }

  /** Update an existing job application */
  update(id: number, app: JobApplication): Observable<void> {
    return this.http.put<void>(`${this.apiBaseUrl}/${id}`, app, {
      headers: this.auth.authHeaders()
    });
  }

  /** Delete a job application */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiBaseUrl}/${id}`, {
      headers: this.auth.authHeaders()
    });
  }
}
