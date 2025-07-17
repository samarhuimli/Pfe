import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-execution-result',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './execution-result.component.html',
  styleUrls: ['./execution-result.component.scss']
})
export class ExecutionResultComponent implements OnChanges {
  @Input() executions: {
    _id?: string;
    success: boolean;
    output: string;
    error: string;
    date?: Date;
    createdBy?: string;
  }[] = [];

  @Output() deleteExecution = new EventEmitter<string>();

  @Input() title: string = 'Résultat d\'exécution';
  @Input() success?: boolean;
  @Input() output?: string;
  @Input() error?: string;
  @Input() date?: Date;
  @Input() createdBy?: string;

  collapseStates: boolean[] = [];
  displayMode: 'single' | 'multiple' = 'multiple';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['executions']) {
      console.log('Executions reçues dans ExecutionResultComponent:', JSON.stringify(this.executions, null, 2));
      this.displayMode = 'multiple';
      this.collapseStates = this.executions.map(() => true);
    } else if (changes['success'] || changes['output'] || changes['error'] || changes['createdBy']) {
      this.displayMode = 'single';
      this.executions = [{
        success: this.success || false,
        output: this.output || '',
        error: this.error || '',
        date: this.date,
        createdBy: this.createdBy
      }];
      console.log('Exécution unique générée:', this.executions);
      this.collapseStates = [true];
    }
  }

  exportToCSV(): void {
  if (!this.executions || this.executions.length === 0) {
    console.warn('Aucune exécution à exporter.');
    return;
  }

  // Création de l'en-tête CSV
  const headers = ['Succès', 'Résultat', 'Erreur', 'Date', 'Créé par'];
  const csvRows = [headers.join(';')]; // Utilise ; pour la compatibilité FR

  // Transformation des données
  for (const exec of this.executions) {
    const row = [
      exec.success ? 'Succès' : 'Échec',
      `"${(exec.output || '').replace(/"/g, '""')}"`, // Échapper les guillemets
      `"${(exec.error || '').replace(/"/g, '""')}"`,
      exec.date ? new Date(exec.date).toLocaleString() : '',
      exec.createdBy || ''
    ];
    csvRows.push(row.join(';'));
  }

  // Création du blob CSV
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);

  // Création du lien de téléchargement
  const link = document.createElement('a');
  link.href = url;
  link.download = 'executions.csv';
  link.click();

  // Nettoyage
  window.URL.revokeObjectURL(url);
}


  toggleCollapse(index: number): void {
    this.collapseStates[index] = !this.collapseStates[index];
  }

  onDeleteClick(executionId: string | undefined, event: MouseEvent): void {
    event.stopPropagation();
    console.log('Clic sur le bouton Supprimer, executionId:', executionId);
    if (!executionId) {
      console.error('ID d\'exécution manquant, impossible d\'émettre l\'événement');
      // Pour tester, émettre un ID fictif
      executionId = 'test-id';
      console.warn('Utilisation d\'un ID fictif pour tester:', executionId);
    }
    this.deleteExecution.emit(executionId);
    console.log('Événement deleteExecution émis avec executionId:', executionId);
  }
}