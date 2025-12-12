import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginModel = {
    email: '',
    password: ''
  };

  registerModel = {
    email: '',
    password: '',
    confirmPassword: ''
  };

  activeTab: 'login' | 'register' = 'login';
  isSubmitting = false;

  errorMessage = '';
  successMessage = '';
  lastErrorStatus: number | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const path = this.route.snapshot.routeConfig?.path;
    if (path === 'register') {
      this.activeTab = 'register';
    }
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.lastErrorStatus = null;
    if (this.activeTab === 'login') {
      this.handleLogin();
    } else {
      this.handleRegister();
      this.cdr.detectChanges();
    }
  }

  switchTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
    this.isSubmitting = false;
  }

  private handleLogin(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.loginModel.email.trim() || !this.loginModel.password.trim()) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.isSubmitting = true;
    this.auth
      .login(this.loginModel.email.trim(), this.loginModel.password)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Signed in! Redirecting...';
          const returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/jobs';
          this.navigateWithDelay(returnUrl);
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.lastErrorStatus = err?.status ?? null;
          this.errorMessage = this.extractError(err) ?? 'Invalid credentials.';
          this.successMessage = '';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
  }

  private handleRegister(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.registerModel.email.trim() || !this.registerModel.password.trim()) {
      this.errorMessage = 'Email and password are required.';
      return;
    }
    if (this.registerModel.password !== this.registerModel.confirmPassword) {
      this.errorMessage = 'Passwords must match.';
      return;
    }

    this.isSubmitting = true;
    this.auth
      .register(this.registerModel.email.trim(), this.registerModel.password)
      .subscribe({
        next: () => {
          this.isSubmitting = false;
          this.successMessage = 'Account created! Redirecting to your applications...';
          this.navigateWithDelay('/jobs');
          this.cdr.detectChanges();
        },
        error: err => {
          console.error(err);
          this.lastErrorStatus = err?.status ?? null;
          const serverMessage = this.extractError(err, /*isRegister*/ true);
          const friendly =
            serverMessage ||
            (err?.status === 409
              ? 'An account with that email already exists.'
              : 'That email may already be registered. Try logging in or use a different email.');
          this.errorMessage = `${friendly}`;
          this.successMessage = '';
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
  }

  private extractError(err: any, isRegister = false): string | null {
    if (!err) return null;
    if (typeof err === 'string') return err;
    if (err.error) {
      if (typeof err.error === 'string') return err.error;
      if (err.error.message) return err.error.message;
      if (err.error.errors) {
        const values = Object.values(err.error.errors as Record<string, string[]>);
        if (values.length && values[0].length) return values[0][0];
      }
    }
    if (err.status === 400 && isRegister) {
      return 'Account with that email may already exist or the data is invalid.';
    }
    if (err.status === 409 && isRegister) {
      return 'An account with that email already exists.';
    }
    if (err.status === 0) {
      return 'Could not reach the server. Check your connection or API status.';
    }
    if (err.message) return err.message;
    return null;
  }

  get isLoginDisabled(): boolean {
    return (
      this.isSubmitting ||
      !this.loginModel.email.trim() ||
      !this.loginModel.password.trim()
    );
  }

  get isRegisterDisabled(): boolean {
    return (
      this.isSubmitting ||
      !this.registerModel.email.trim() ||
      !this.registerModel.password.trim() ||
      !this.registerModel.confirmPassword.trim() ||
      this.registerModel.password !== this.registerModel.confirmPassword
    );
  }

  private navigateWithDelay(url: string): void {
    setTimeout(() => this.router.navigateByUrl(url), 700);
  }
}
