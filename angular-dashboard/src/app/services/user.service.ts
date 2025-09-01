import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface BackendUser {
  username: string;
  password: string;
  role: string;
  enabled: boolean;
  validationCode?: string;
}

export interface User {
  username: string;
  email: string;
  password?: string;
  role: 'ROLE_ADMIN' | 'ROLE_SCIENTIST' | 'ROLE_ANALYSTE';
  enabled: boolean;
  validationCode?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private readonly API_URL = 'http://localhost:8085/api/users';

  constructor(private http: HttpClient) { }

  // Get all users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get user by username
  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${username}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Create new user
  createUser(user: User): Observable<User> {
    return this.http.post<User>(this.API_URL, user)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete user by username or name
  deleteUser(identifier: string): Observable<{ message: string }> {
    // Encode the identifier to handle special characters
    const encodedIdentifier = encodeURIComponent(identifier);
    
    return this.http.delete<{ message: string }>(
      `${this.API_URL}/${encodedIdentifier}`,
      {
        headers: {
          'Content-Type': 'application/json',
          // Add any required authentication headers here
        },
        withCredentials: true // Include this if you're using cookies for auth
      }
    ).pipe(
      catchError(error => {
        console.error('Error in deleteUser:', error);
        // You can add more specific error handling here if needed
        return throwError(() => error);
      })
    );
  }

  // Update user
  updateUser(username: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${username}`, userData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get users by role
  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.API_URL}/role/${role}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update validation code
  updateValidationCode(username: string, validationCode: string): Observable<User> {
    const encodedUsername = encodeURIComponent(username);
    return this.http.put<User>(`${this.API_URL}/${encodedUsername}/validation-code`, { validationCode }).pipe(
      catchError(this.handleError)
    );
  }

  // Enable user
  enableUser(username: string): Observable<{message: string, user: User}> {
    const encodedUsername = encodeURIComponent(username);
    return this.http.put<{message: string, user: User}>(`${this.API_URL}/${encodedUsername}/enable`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Disable user
  disableUser(username: string): Observable<{message: string, user: User}> {
    const encodedUsername = encodeURIComponent(username);
    return this.http.put<{message: string, user: User}>(`${this.API_URL}/${encodedUsername}/disable`, {}).pipe(
      catchError(this.handleError)
    );
  }

  // Check if user exists
  checkUserExists(username: string): Observable<{exists: boolean}> {
    return this.http.get<{exists: boolean}>(`${this.API_URL}/${username}/exists`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get role display name
  getRoleDisplayName(role: string): string {
    switch (role) {
      case 'ROLE_ADMIN':
        return 'Administrateur';
      case 'ROLE_SCIENTIST':
        return 'Scientifique';
      case 'ROLE_ANALYSTE':
        return 'Analyste';
      default:
        return role;
    }
  }

  // Get available roles
  getAvailableRoles(): Array<{value: string, label: string}> {
    return [
      { value: 'ROLE_ADMIN', label: 'Administrateur' },
      { value: 'ROLE_SCIENTIST', label: 'Scientifique' },
      { value: 'ROLE_ANALYSTE', label: 'Analyste' }
    ];
  }

  // Error handling
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.error?.message || error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => ({
      error: {
        message: errorMessage,
        error: error.error?.error || error.message
      },
      message: error.error?.message || error.message
    }));
  }
}
