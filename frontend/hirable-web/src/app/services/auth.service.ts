import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import { environment } from '../../environment';

export interface AuthState {
  isLoggedIn: boolean;
  email: string | null;
  token: string | null;
}

export interface AuthResponse {
  token: string;
  email: string;
}

const STORAGE_KEY = 'hirable-auth';
const API_BASE = environment.apiBaseUrl;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private stateSubject = new BehaviorSubject<AuthState>({
    isLoggedIn: false,
    email: null,
    token: null
  });

  state$ = this.stateSubject.asObservable();

  isLoggedIn$: Observable<boolean> = this.state$.pipe(
    map(s => s.isLoggedIn)
  );

  constructor(private router: Router, private http: HttpClient) {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthState;
        this.stateSubject.next(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }

  get snapshot(): AuthState {
    return this.stateSubject.value;
  }

  register(email: string, password: string): Observable<void> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/register`, { email, password })
      .pipe(
        tap(res => this.persistAuth(res)),
        map(() => void 0)
      );
  }

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<AuthResponse>(`${API_BASE}/auth/login`, { email, password })
      .pipe(
        tap(res => this.persistAuth(res)),
        map(() => void 0)
      );
  }

  logout(): void {
    const nextState: AuthState = {
      isLoggedIn: false,
      email: null,
      token: null
    };
    this.stateSubject.next(nextState);
    localStorage.removeItem(STORAGE_KEY);
    this.router.navigate(['/login']);
  }

  authHeaders(): HttpHeaders {
    const token = this.snapshot.token;
    if (!token) {
      return new HttpHeaders();
    }
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  private persistAuth(res: AuthResponse): void {
    const nextState: AuthState = {
      isLoggedIn: true,
      email: res.email,
      token: res.token
    };
    this.stateSubject.next(nextState);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  }
}
