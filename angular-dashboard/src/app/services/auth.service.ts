import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';

interface LoginResponse {
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:8085/api/auth';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    this.isAuthenticatedSubject.next(!!token);
  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, { username, password })
      .pipe(
        tap(response => {
          // Store the token
          localStorage.setItem('auth_token', response.token);
          console.log('auth',username)
          localStorage.setItem('username', username);
           if (username === 'samar@scientist.com') {   // ⚠️ ici problème
          localStorage.setItem('role', "scientist");
        } else {
          localStorage.setItem('role', "admin");
        }
          this.isAuthenticatedSubject.next(true);
          this.router.navigate(['/dashboard']);
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('auth_token');
       localStorage.removeItem('username');
    localStorage.removeItem('role');


    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred';
    
    if (error.status === 401) {
      errorMessage = 'Invalid username or password';
    } else if (error.error && typeof error.error === 'string') {
      errorMessage = error.error;
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.statusText) {
      errorMessage = error.statusText;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}