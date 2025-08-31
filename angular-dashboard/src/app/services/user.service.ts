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

  // Update user
  updateUser(username: string, user: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${username}`, user)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete user
  deleteUser(username: string): Observable<{message: string}> {
    return this.http.delete<{message: string}>(`${this.API_URL}/${username}`)
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
    return this.http.put<User>(`${this.API_URL}/${username}/validation-code`, { validationCode })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Enable user
  enableUser(username: string): Observable<{message: string, user: User}> {
    return this.http.put<{message: string, user: User}>(`${this.API_URL}/${username}/enable`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Disable user
  disableUser(username: string): Observable<{message: string, user: User}> {
    return this.http.put<{message: string, user: User}>(`${this.API_URL}/${username}/disable`, {})
      .pipe(
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
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Une erreur inconnue est survenue';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.error && error.error.error) {
        errorMessage = error.error.error;
      } else if (error.status === 404) {
        errorMessage = 'Utilisateur non trouvé';
      } else if (error.status === 400) {
        errorMessage = 'Données invalides';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur interne';
      } else {
        errorMessage = `Erreur ${error.status}: ${error.message}`;
      }
    }
    
    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
