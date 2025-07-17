import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScriptService, Script } from '../../services/script.service';
import { ExecutionService } from 'src/app/services/execution.service';
import { ExecutionResultComponent } from '../../execution-result/execution-result.component';
import { NgForm } from '@angular/forms';
import { ExecutionResultDTO } from 'src/app/models/execution-result.model';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-script-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ExecutionResultComponent],
  templateUrl: './script-edit.component.html',
  styleUrls: ['./script-edit.component.scss'],
  providers: [DatePipe]
})
export class ScriptEditComponent implements OnInit {
  scriptId!: number;
  script: Script = { id: 0, title: '', type: 'PYTHON', createdBy: '', content: '' };
  isEdit = true;

  output: string = '';
  isRunning: boolean = false;
  editorFocused: boolean = false;
  lastRunTime: string | null = null;
  groupedExecutions: any[] = [];
  showExecutionHistory: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private scriptService: ScriptService,
    private router: Router,
    private executionService: ExecutionService,
    private datePipe: DatePipe
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.scriptId = +id;
        this.scriptService.findScriptById(this.scriptId).subscribe({
          next: (foundScript) => {
            this.script = { ...foundScript };
          },
          error: (err) => {
            console.error('Script non trouvé', err);
            this.router.navigate(['/scripts']);
          }
        });
        this.loadExecutions();
      }
    });
  }

  loadExecutions(): void {
    this.executionService.getAllExecutionsGrouped().subscribe({
      next: (data) => {
        console.log('Données brutes de getAllExecutionsGrouped:', data);
        this.groupedExecutions = this.processData(data).filter(group => group.scriptId === this.scriptId);
        console.log('Executions groupées pour scriptId', this.scriptId, ':', this.groupedExecutions);
      },
      error: (err) => {
        console.error('Erreur lors du chargement des exécutions:', err);
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
          const status = exec.status || 'UNKNOWN';
          console.log('Exécution:', exec);
          console.log('Status:', status);
          return {
            ...exec,
            _id: executionId,
            status: status,
            timestamp: exec.timestamp ? new Date(exec.timestamp) : new Date(exec.executedAt ? new Date(exec.executedAt) : new Date()),
            formattedTime: this.formatExecutionTime(exec.executionTime),
            formattedDate: exec.timestamp ? this.datePipe.transform(exec.timestamp, 'dd/MM/yy HH:mm') : exec.executedAt ? this.datePipe.transform(exec.executedAt, 'dd/MM/yy HH:mm') : '',
            createdBy: exec.createdBy || 'Inconnu'
          };
        })
        .sort((a: any, b: any) => b.timestamp.getTime() - a.timestamp.getTime());

      return {
        scriptId: group.scriptId || firstExec.scriptId,
        scriptTitle: group.scriptTitle || firstExec.scriptTitle || this.script.title || 'Script sans titre',
        executions: executions,
        isCollapsed: true
      };
    });
  }

  private formatExecutionTime(time?: number): string {
    if (!time) return '-';
    return time < 1000 ? `${time} ms` : `${(time / 1000).toFixed(2)} s`;
  }

  insertTemplate() {
    if (!this.script.type) return;

    switch (this.script.type) {
      case 'PYTHON':
        this.script.content = `# Python script template\n\n# Your code here\nprint("Test")\n`; // Code simple sans dépendances
        break;
      case 'R':
        this.script.content = `# R script template\n\n# Your code here\nprint("Test")\n`;
        break;
      case 'SQL':
        this.script.content = `-- SQL script template\nSELECT * FROM table_name\nWHERE condition;\n`;
        break;
      default:
        this.script.content = `# ${this.script.type} script template\n\n# Your code here\n`;
    }
  }

  formatCode() {
    if (!this.script.content) return;

    if (this.script.type === 'PYTHON') {
      this.script.content = this.script.content
        .split('\n')
        .map(line => line.trim() ? '    ' + line.trim() : '')
        .join('\n');
    }
  }

  async runCode() {
    if (!this.script.content || !this.script.type) return;

    const startTime = performance.now();
    this.isRunning = true;
    this.output = `Exécution du code ${this.script.type}...\n`;

    try {
      console.log('Début de l\'exécution du code:', this.script.type, this.script.content);
      if (this.script.type === 'PYTHON') {
        await this.runPythonCode();
      } else if (this.script.type === 'R') {
        await this.runRCode();
      } else {
        throw new Error('Type de script non supporté');
      }

      const executionTime = performance.now() - startTime;
      this.output += `\nTemps d'exécution: ${executionTime} ms`;
      this.lastRunTime = new Date().toLocaleString();
      this.saveExecutionResult('SUCCESS', null, executionTime);
    } catch (error: any) {
      this.output += '\nErreur: ' + error.message;
      const executionTime = performance.now() - startTime;
      this.lastRunTime = new Date().toLocaleString();
      this.saveExecutionResult('FAILED', error.message, executionTime);
    } finally {
      this.isRunning = false;
    }
  }

  private async runPythonCode() {
    try {
      console.log('Tentative d\'envoi du code Python au backend:', this.script.content);
      const response = await this.executionService.executePythonCode(this.script.content, this.script.id).toPromise();
      console.log('Réponse reçue du backend:', response);
      if (response && response.status) {
        if (response.status === 'SUCCESS') {
          this.output += '\nRésultat: ' + (response.output || 'Aucun résultat');
        } else {
          this.output += '\nErreur: ' + (response.error || 'Erreur inconnue');
        }
      } else {
        throw new Error('Réponse du backend invalide');
      }
    } catch (error: any) {
      this.output += '\nErreur: Échec de la connexion au serveur Python - ' + error.message;
      console.error('Erreur HTTP ou backend:', error);
      throw error;
    }
  }

  private async runRCode() {
    try {
      console.log('Tentative d\'envoi du code R au backend:', this.script.content);
      const response = await this.executionService.executeRCode(this.script.content, this.script.id).toPromise();
      if (response && typeof response === 'object') {
        if (response.error) {
          this.output += '\nErreur: ' + response.error;
        } else {
          this.output += '\nRésultat: ' + (response.output || 'Aucun résultat');
        }
      } else {
        throw new Error('Réponse du backend invalide');
      }
    } catch (error: any) {
      this.output += '\nErreur: Échec de la connexion au serveur R - ' + error.message;
      console.error('Erreur HTTP ou backend:', error);
      throw error;
    }
  }

  private saveExecutionResult(status: string, error: string | null, executionTime: number) {
    const executionResult: ExecutionResultDTO = {
      scriptId: this.script.id,
      output: this.output,
      status: status,
      error: error,
      executionTime: Math.round(executionTime)
    };

    this.executionService.saveExecutionResult(executionResult).subscribe({
      next: () => this.loadExecutions(),
      error: (err) => console.error('Erreur lors de la sauvegarde:', err)
    });
  }

  saveToFile() {
    if (!this.script.content) return;

    const extension = this.script.type === 'R' ? '.r' : this.script.type === 'SQL' ? '.sql' : '.py';
    const filename = this.script.title
      ? `${this.script.title.replace(/[^a-z0-9]/gi, '_')}${extension}`
      : `script${extension}`;

    const blob = new Blob([this.script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearEditor() {
    if (!this.script.content || confirm('Voulez-vous vraiment effacer le contenu ?')) {
      this.script.content = '';
      this.output = '';
    }
  }

  submitForm(scriptForm: NgForm) {
    if (scriptForm.invalid) {
      Object.keys(scriptForm.controls).forEach(key => {
        scriptForm.controls[key].markAsTouched();
      });
      return;
    }

    if (this.isEdit) {
      this.scriptService.updateScript(this.scriptId, this.script).subscribe(() => {
        this.router.navigate(['/scripts']);
      });
    } else {
      this.scriptService.createScript(this.script).subscribe(newScript => {
        this.script.id = newScript.id;
        this.scriptService.addScriptToLocal(newScript);
        this.router.navigate(['/scripts']);
      });
    }
  }

  cancel() {
    this.router.navigate(['/scripts']);
  }

  toggleExecutionHistory(): void {
    this.showExecutionHistory = !this.showExecutionHistory;
  }

  onDeleteExecution(executionId: string): void {
    this.executionService.deleteExecution(executionId).subscribe({
      next: () => {
        console.log('Exécution supprimée avec succès');
        this.loadExecutions();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
      }
    });
  }

  // Méthode pour gérer la date
  getExecutionDate(): Date | null {
    return this.lastRunTime ? new Date(this.lastRunTime) : null;
  }
}