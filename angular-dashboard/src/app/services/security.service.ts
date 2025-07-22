import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SecurityService {
  private apiUrl = 'http://localhost:8085/api/security'; // URL absolue

  constructor(private http: HttpClient) {}

  getAvailableTables(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tables`).pipe(
      catchError(error => {
        console.error('Erreur tables disponibles:', error);
        return throwError(() => error);
      })
    );
  }

  getForbiddenTables(): Observable<Set<string>> {
    return this.http.get<Set<string>>(`${this.apiUrl}/forbidden-tables`).pipe(
      catchError(error => {
        console.error('Erreur tables interdites:', error);
        return throwError(() => new Set<string>());
      })
    );
  }

  getAllowedOperations(): Observable<Set<string>> {
    return this.http.get<Set<string>>(`${this.apiUrl}/allowed-operations`).pipe(
      catchError(error => {
        console.error('Erreur opérations autorisées:', error);
        return throwError(() => new Set<string>());
      })
    );
  }

  saveForbiddenTables(tables: string[]): Observable<string> {
    return this.http.post(`${this.apiUrl}/forbidden-tables`, tables, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  saveAllowedOperations(operations: string[]): Observable<string> {
    return this.http.post(`${this.apiUrl}/allowed-operations`, operations, { responseType: 'text' }).pipe(
      catchError(error => throwError(() => error))
    );
  }

  notifyExecution(forbiddenTables: string[], allowedOperations: string[]): Observable<any> {
    console.log('Envoi notification à:', `http://localhost:8085/api/executions/update-security`);
    return this.http.post(`http://localhost:8085/api/executions/update-security`, { forbiddenTables, allowedOperations }, { responseType: 'text' }).pipe(
      catchError(error => {
        console.error('Erreur notification:', error);
        return throwError(() => error);
      })
    );
}
  }
