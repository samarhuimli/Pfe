import { Component, OnInit } from '@angular/core';
import { LogService } from '../services/log.service';
import { ExecutionLog } from '../models/execution-log.model';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-admin-logs',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule],
  templateUrl: './admin-logs.component.html',
  styleUrls: ['./admin-logs.component.scss'],
  providers: [DatePipe]
})
export class AdminLogsComponent implements OnInit {
  logs: ExecutionLog[] = [];
  errorMessage: string = '';

  constructor(
    private logService: LogService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.logService.getExecutionLogs().subscribe({
      next: (data) => {
        this.logs = data;
      },
      error: (err) => {
        this.errorMessage = 'Erreur lors du chargement des logs : ' + err.message;
        console.error('Erreur:', err);
      }
    });
  }

  clearAllLogs(): void {
    if (confirm('Voulez-vous vraiment supprimer tous les logs ?')) {
      this.logService.clearExecutionLogs().subscribe({
        next: () => {
          this.logs = [];
          this.errorMessage = 'Tous les logs ont été supprimés.';
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression des logs : ' + err.message;
        }
      });
    }
  }

  deleteLog(id: number): void {
    if (confirm(`Voulez-vous vraiment supprimer le log avec ID ${id} ?`)) {
      this.logService.deleteExecutionLog(id).subscribe({
        next: () => {
          this.logs = this.logs.filter(log => log.id !== id);
          this.errorMessage = 'Log supprimé avec succès.';
        },
        error: (err) => {
          this.errorMessage = 'Erreur lors de la suppression du log : ' + err.message;
        }
      });
    }
  }

  formatDate(date: string): string {
    return this.datePipe.transform(date, 'medium') || '';
  }
}