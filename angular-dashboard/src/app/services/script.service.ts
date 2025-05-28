import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, tap, throwError } from 'rxjs';

export interface Script {
  id?: number;
  title: string;
  content: string;
  createdBy: string;
  type: 'PYTHON' | 'R' | 'SQL';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ScriptService {
  private apiUrl = 'http://localhost:8082/api/scripts';
  
  private scriptsSubject: BehaviorSubject<Script[]> = new BehaviorSubject<Script[]>(this.loadScriptsFromLocalStorage());
  private scripts: Script[] = this.scriptsSubject.value;

  constructor(private http: HttpClient) {}

  // ➡️ Récupérer tous les scripts depuis l'API
  getScripts(): Observable<Script[]> {
    return this.http.get<Script[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération des scripts', error);
        return throwError(() => new Error('Erreur lors de la récupération des scripts'));
      })
    );
  }

  // ➡️ Ajouter un nouveau script via l'API
  createScript(script: Script): Observable<Script> {
    return this.http.post<Script>(this.apiUrl, script).pipe(
      catchError((error) => {
        console.error('Erreur lors de la création du script', error);
        return throwError(() => new Error('Erreur lors de la création du script'));
      })
    );
  }

  // ✅ NOUVELLE VERSION CORRIGÉE
  // ➡️ Modifier un script existant VRAIMENT via l'API (plus localStorage)
  updateScript(id: number, updatedScript: Script): Observable<Script> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.put<Script>(url, updatedScript).pipe(
      catchError((error) => {
        console.error('Erreur lors de la mise à jour du script', error);
        return throwError(() => new Error('Erreur lors de la mise à jour du script'));
      })
    );
  }

  // ➡️ Supprimer un script via l'API
  deleteScript(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error('Erreur lors de la suppression du script', error);
        return throwError(() => new Error('Erreur lors de la suppression du script'));
      }),
      tap(() => {
        this.scripts = this.scripts.filter(script => script.id !== id);
        this.scriptsSubject.next(this.scripts);
        this.saveScriptsToLocalStorage();
      })
    );
  }

  // ✅ NOUVELLE VERSION améliorée (accès à l'API)
  // ➡️ Chercher un script par ID (depuis API et non localStorage)
  findScriptById(id: number): Observable<Script> {
    const url = `${this.apiUrl}/${id}`;
    return this.http.get<Script>(url).pipe(
      catchError((error) => {
        console.error('Erreur lors de la récupération du script', error);
        return throwError(() => new Error('Erreur lors de la récupération du script'));
      })
    );
  }

  // ➡️ Exécuter un script via l'API
  executeScript(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/${id}/execute`, {}).pipe(
      catchError((error) => {
        console.error('Erreur lors de l\'exécution du script', error);
        return throwError(() => new Error('Erreur lors de l\'exécution du script'));
      })
    );
  }

  // ➡️ Récupérer la liste locale des scripts (Observable)
  getScriptsObservable(): Observable<Script[]> {
    return this.scriptsSubject.asObservable();
  }
  getAllScriptsFromBackend() {
    this.http.get<Script[]>(this.apiUrl).subscribe(scripts => {
      this.scriptsSubject.next(scripts);
    });
  }

  // ➡️ Mettre à jour la liste locale et sauvegarder
  updateScripts(scripts: Script[]): void {
    this.scripts = scripts;
    this.scriptsSubject.next(this.scripts);
    this.saveScriptsToLocalStorage();
  }

  // ➡️ Ajouter un script à la liste locale
  addScriptToLocal(script: Script): void {
    this.scripts.push(script);
    this.scriptsSubject.next(this.scripts);
    this.saveScriptsToLocalStorage();
  }

  // ➡️ Charger les scripts depuis localStorage
  private loadScriptsFromLocalStorage(): Script[] {
    const scripts = localStorage.getItem('scripts');
    return scripts ? JSON.parse(scripts) : [];
  }

  // ➡️ Sauvegarder les scripts dans localStorage
  private saveScriptsToLocalStorage(): void {
    localStorage.setItem('scripts', JSON.stringify(this.scripts));
  }

  getScriptById(id: number): Observable<Script> {
    return this.http.get<Script>(`${this.apiUrl}/${id}`);
  }

  // getAllScripts(): Observable<any[]> {
  //   return this.http.get<any[]>('/api/scripts');
  // }
}