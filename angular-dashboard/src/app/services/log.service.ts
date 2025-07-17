import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ExecutionLog } from '../models/execution-log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private apiUrl = 'http://localhost:8085/api/executions';

  constructor(private http: HttpClient) { }

  getExecutionLogs(): Observable<ExecutionLog[]> {
    return this.http.get<ExecutionLog[]>(`${this.apiUrl}/execution-logs`);
  }

  clearExecutionLogs(): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/clear-execution-logs`);
  }

  deleteExecutionLog(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/execution-logs/${id}`);
  }
}