import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, map, Observable, tap, throwError } from 'rxjs';
import { ExecutionResultDTO } from '../models/execution-result.model';

@Injectable({
  providedIn: 'root'
})
export class ExecutionService {
  private apiUrl = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {}

  deleteExecution(executionId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/executions/${executionId}`, {
      observe: 'response'
    }).pipe(
      tap(response => console.log('Réponse suppression:', response)),
      map(response => response.body),
      catchError(err => {
        console.error('Erreur HTTP lors de la suppression:', err);
        return throwError(() => new Error('Erreur lors de la suppression de l\'exécution: ' + err.message));
      })
    );
  }

  saveExecutionResult(result: ExecutionResultDTO): Observable<any> {
    // Convertir executionTime de number à string pour l'API
    const payload = {
      ...result,
      executionTime: result.executionTime != null ? result.executionTime.toString() : undefined
    };
    console.log('Envoi de la sauvegarde:', payload);
    return this.http.post(`${this.apiUrl}/executions/save`, payload).pipe(
      tap(response => console.log('Réponse de la sauvegarde:', response)),
      catchError(err => {
        console.error('Erreur HTTP lors de la sauvegarde:', err);
        return throwError(() => new Error('Erreur lors de la sauvegarde de l\'exécution: ' + err.message));
      })
    );
  }

  executeRCode(code: string, scriptId: number | null): Observable<ExecutionResultDTO> {
    const body = { code, scriptId };
    console.log('Envoi du script R au serveur:', body);
    return this.http.post<ExecutionResultDTO>(`${this.apiUrl}/executions/executeR`, body, { observe: 'response' }).pipe(
      tap(response => console.log('Réponse de l\'exécution R:', response)),
      map(response => {
        const body = response.body as ExecutionResultDTO;
        // Convertir executionTime de string à number
        if (body.executionTime) {
          body.executionTime = parseFloat(body.executionTime as unknown as string);
        }
        return body;
      }),
      catchError((err: HttpErrorResponse) => {
        console.error('Erreur HTTP lors de l\'exécution R:', err);
        // Si l'erreur contient une réponse avec un corps, extraire le message d'erreur
        if (err.error && err.error.error) {
          return throwError(() => new Error(err.error.error));
        }
        return throwError(() => new Error('Erreur lors de l\'exécution du code R: ' + err.message));
      })
    );
  }

  getAllExecutionsGrouped(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/executions/grouped`).pipe(
      tap(response => console.log('Réponse de getAllExecutionsGrouped:', response)),
      map(groups => groups.map(group => ({
        ...group,
        executions: group.executions.map((exec: any) => ({
          ...exec,
          executionTime: exec.executionTime ? parseFloat(exec.executionTime) : undefined // Convertir string en number
        }))
      }))),
      catchError(err => {
        console.error('Erreur HTTP lors de la récupération des exécutions groupées:', err);
        return throwError(() => new Error('Erreur lors de la récupération des exécutions groupées: ' + err.message));
      })
    );
  }

  getExecutionsByScriptId(scriptId: number): Observable<ExecutionResultDTO[]> {
    return this.http.get<any[]>(`${this.apiUrl}/executions/byScriptId/${scriptId}`).pipe(
      tap(response => console.log('Réponse de getExecutionsByScriptId:', response)),
      map(executions => executions.map(exec => ({
        ...exec,
        executionTime: exec.executionTime ? parseFloat(exec.executionTime) : undefined // Convertir string en number
      }) as ExecutionResultDTO)),
      catchError(err => {
        console.error('Erreur HTTP lors de la récupération des exécutions par scriptId:', err);
        return throwError(() => new Error('Erreur lors de la récupération des exécutions par scriptId: ' + err.message));
      })
    );
  }
}