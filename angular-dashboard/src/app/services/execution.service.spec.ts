// execution.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ExecutionResultDTO } from '../models/execution-result.model';

@Injectable({
  providedIn: 'root'
})
export class ExecutionService {
  private apiUrl = 'http://localhost:8082/api/executions';

  constructor(private http: HttpClient) {}

  saveExecutionResult(result: ExecutionResultDTO): Observable<any> {
    return this.http.post(`${this.apiUrl}/save`, result);
  }
}