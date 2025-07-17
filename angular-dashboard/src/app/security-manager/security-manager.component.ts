import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-security-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-manager.component.html',
  styleUrls: ['./security-manager.component.scss']
})
export class SecurityManagerComponent implements OnInit {
  forbiddenTables: string[] = [];
  allowedOperations: string[] = [];
  newForbiddenTable: string = '';
  newAllowedOperation: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Charger les données initiales depuis le backend
    this.http.get<string[]>('/api/security/forbidden-tables').subscribe(data => {
      this.forbiddenTables = data;
    });
    this.http.get<string[]>('/api/security/allowed-operations').subscribe(data => {
      this.allowedOperations = data;
    });
  }

  addForbiddenTable() {
    if (this.newForbiddenTable && !this.forbiddenTables.includes(this.newForbiddenTable)) {
      this.forbiddenTables.push(this.newForbiddenTable);
      this.newForbiddenTable = '';
    }
  }

  removeForbiddenTable(table: string) {
    this.forbiddenTables = this.forbiddenTables.filter(t => t !== table);
  }

  addAllowedOperation() {
    if (this.newAllowedOperation && !this.allowedOperations.includes(this.newAllowedOperation)) {
      this.allowedOperations.push(this.newAllowedOperation);
      this.newAllowedOperation = '';
    }
  }

  removeAllowedOperation(operation: string) {
    this.allowedOperations = this.allowedOperations.filter(op => op !== operation);
  }

  saveConfig() {
    this.http.post('/api/security/forbidden-tables', this.forbiddenTables).subscribe({
      next: (response: any) => alert(response),
      error: (err) => alert('Erreur lors de la sauvegarde des tables interdites')
    });
    this.http.post('/api/security/allowed-operations', this.allowedOperations).subscribe({
      next: (response: any) => alert(response),
      error: (err) => alert('Erreur lors de la sauvegarde des opérations autorisées')
    });
  }
}