import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ExecutionService } from 'src/app/services/execution.service';
import { ExecutionResultComponent } from '../execution-result/execution-result.component';

@Component({
  selector: 'app-execution-history',
  standalone: true,
  imports: [CommonModule, ExecutionResultComponent],
  templateUrl: './execution-history.component.html',
  styleUrls: ['./execution-history.component.scss'],
  providers: [DatePipe]
})
export class ExecutionHistoryComponent implements OnInit {
  groupedExecutions: any[] = [];
  isLoading: boolean = true;
  showConfirmModal: boolean = false;
  executionToDelete: string | null = null;

  constructor(
    private executionService: ExecutionService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.loadExecutions();
  }

  loadExecutions(): void {
    this.isLoading = true;
    this.executionService.getAllExecutionsGrouped().subscribe({
      next: (data) => {
        console.log('Données brutes de l\'API:', JSON.stringify(data, null, 2));
        this.groupedExecutions = this.processData(data);
        console.log('Executions groupées traitées:', this.groupedExecutions);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement:', err);
        this.isLoading = false;
      }
    });
  }

  private processData(data: any[]): any[] {
    return data.map(group => {
      const firstExec = group.executions[0] || {};
      const executions = group.executions
        .map((exec: any) => {
          const executionId = exec._id || exec.id || null;
          if (!executionId) {
            console.warn('Execution sans _id ou id:', exec);
          }
          // Normaliser success en fonction de error
          const success = !exec.error; // Une exécution est réussie uniquement s'il n'y a pas d'erreur
          console.log('Exécution traitée:', { id: executionId, success, output: exec.output, error: exec.error });
          return {
            ...exec,
            _id: executionId,
            success: success, // S'assurer que success est cohérent avec error
            timestamp: exec.timestamp ? new Date(exec.timestamp) : new Date(),
            status: success ? 'success' : 'failed',
            formattedTime: this.formatExecutionTime(exec.executionTime),
            formattedDate: exec.timestamp ? this.datePipe.transform(exec.timestamp, 'dd/MM/yy HH:mm') : '',
            createdBy: exec.createdBy || 'Inconnu'
          };
        })
        .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        ...group,
        scriptTitle: group.title || firstExec.title || firstExec.scriptTitle || 'Script sans titre',
        executions: executions,
        isCollapsed: true
      };
    });
  }

  private formatExecutionTime(time?: number): string {
    if (!time) return '-';
    return time < 1000 ? `${time} ms` : `${(time / 1000).toFixed(2)} s`;
  }

  toggleGroup(group: any): void {
    group.isCollapsed = !group.isCollapsed;
  }

  requestDeleteExecution(executionId: string): void {
    console.log('requestDeleteExecution appelé avec executionId:', executionId);
    this.executionToDelete = executionId;
    this.showConfirmModal = true;
    console.log('showConfirmModal défini à:', this.showConfirmModal);
  }

  confirmDelete(): void {
    if (this.executionToDelete) {
      console.log('Suppression de l\'exécution:', this.executionToDelete);
      this.executionService.deleteExecution(this.executionToDelete).subscribe({
        next: () => {
          console.log('Suppression réussie');
          this.loadExecutions();
          this.closeModal();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.closeModal();
        }
      });
    } else {
      console.error('Aucun executionId à supprimer');
      this.closeModal();
    }
  }

  closeModal(): void {
    console.log('Fermeture de la modale');
    this.showConfirmModal = false;
    this.executionToDelete = null;
  }
}