import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ScriptAnalysisService {
  private apiUrl = 'http://localhost:8085/analyze';

  constructor(private http: HttpClient) {}

  analyzePython(script: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/python`, script, { responseType: 'text' });
  }

  analyzeR(script: string): Observable<string> {
    return this.http.post(`${this.apiUrl}/r`, script, { responseType: 'text' });
  }
} 