import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SecurityService } from '../services/security.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-security-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './security-manager.component.html',
  styleUrls: ['./security-manager.component.scss']
})
export class SecurityManagerComponent implements OnInit {
  availableTables: string[] = [];
  forbiddenTables: string[] = [];
  allowedOperations: string[] = [];
  selectedTable: string = '';
  newAllowedOperation: string = '';
  isSaving: boolean = false;
  errorMessage: string = '';

  constructor(private securityService: SecurityService) {}

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    console.log('Chargement des données...');
    forkJoin({
      tables: this.securityService.getAvailableTables(),
      forbidden: this.securityService.getForbiddenTables(),
      allowed: this.securityService.getAllowedOperations()
    }).subscribe({
      next: ({ tables, forbidden, allowed }) => {
        console.log('Données reçues - Tables:', tables);
        this.availableTables = tables || [];
        this.forbiddenTables = Array.from(forbidden || []);
        this.allowedOperations = Array.from(allowed || []);
        if (this.availableTables.length === 0) {
          this.errorMessage = 'Aucune table récupérée.';
        }
      },
      error: (err) => {
        console.error('Erreur détaillée:', err);
        this.errorMessage = `Erreur backend: ${err.status} - ${err.message}. Consultez les logs.`;
      }
    });
  }

  addForbiddenTable() {
    if (this.selectedTable && !this.forbiddenTables.includes(this.selectedTable)) {
      this.forbiddenTables.push(this.selectedTable);
      this.selectedTable = '';
    }
  }

  removeForbiddenTable(table: string) {
    this.forbiddenTables = this.forbiddenTables.filter(t => t !== table);
    this.saveConfig();
  }

  addAllowedOperation() {
    if (this.newAllowedOperation && !this.allowedOperations.includes(this.newAllowedOperation)) {
      this.allowedOperations.push(this.newAllowedOperation);
      this.newAllowedOperation = '';
    }
  }

  removeAllowedOperation(operation: string) {
    this.allowedOperations = this.allowedOperations.filter(op => op !== operation);
    this.saveConfig();
  }

saveConfig() {
  this.isSaving = true;
  this.securityService.saveForbiddenTables(this.forbiddenTables).subscribe({
    next: (response) => {
      console.log('Sauvegarde tables interdites:', response);
      this.securityService.saveAllowedOperations(this.allowedOperations).subscribe({
        next: (response) => {
          console.log('Sauvegarde opérations:', response);
          this.securityService.notifyExecution(this.forbiddenTables, this.allowedOperations).subscribe({
            next: (response) => {
              console.log('Notification réussie:', response);
              alert('Sauvegardé avec succès');
              this.isSaving = false;
            },
            error: (err) => {
              console.warn('Erreur notification (non bloquante):', err);
              this.errorMessage = `Notification échouée: ${err.status} - ${err.message} (sauvegarde réussie)`;
              alert('Sauvegardé avec succès (notification échouée)');
              this.isSaving = false;
            }
          });
        },
        error: (err) => {
          console.error('Erreur sauvegarde opérations:', err);
          alert('Erreur sauvegarde opérations');
          this.isSaving = false;
        }
      });
    },
    error: (err) => {
      console.error('Erreur sauvegarde tables:', err);
      this.errorMessage = `Erreur sauvegarde tables: ${err.status} - ${err.message}`;
      alert('Erreur sauvegarde tables');
      this.isSaving = false;
    }
  });
}
}