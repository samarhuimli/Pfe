import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScriptService, Script } from '../../services/script.service';
import { ExecutionResultComponent } from '../../execution-result/execution-result.component';
import { ExecutionService } from 'src/app/services/execution.service';
import { NgForm } from '@angular/forms';
import { ExecutionResultDTO } from 'src/app/models/execution-result.model';
import { DatePipe } from '@angular/common';

declare function loadPyodide(config: {
  stdout?: (text: string) => void,
  stderr?: (text: string) => void
}): Promise<any>;

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

  output: string = '';
  isRunning: boolean = false;
  pyodide: any = null;
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
        this.script.content = `# Python script template\nimport pandas as pd\n\n# Your code here\n`;
        break;
      case 'R':
        this.script.content = `# R script template\nlibrary(tidyverse)\n\n# Your code here\n`;
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
    this.lastRunTime = new Date().toLocaleString();

    try {
      if (this.script.type === 'PYTHON') {
        if (!this.pyodide) {
          this.pyodide = await loadPyodide({
            stdout: (text: string) => this.output += text,
            stderr: (text: string) => this.output += text
          });
          await this.pyodide.loadPackage(['numpy']);
        }

        const result = await this.pyodide.runPython(this.script.content);
        if (result) this.output += '\nRésultat: ' + result;

        const executionTime = Math.round(performance.now() - startTime);
        this.executionService.saveExecutionResult({
          scriptId: this.script.id,
          output: this.output,
          status: 'SUCCESS',
          executionTime: executionTime
        }).subscribe({
          next: () => this.loadExecutions(),
          error: (err) => console.error('Erreur lors de la sauvegarde:', err)
        });
      } else if (this.script.type === 'R') {
        const response = await this.executionService.executeRCode(this.script.content, this.script.id).toPromise();
        if (response.status === 'FAILED' || response.error) {
          this.output += '\nErreur: ' + (response.error || 'Erreur inconnue lors de l\'exécution R');
          const executionTime = response.executionTime ?? Math.round(performance.now() - startTime);
          this.executionService.saveExecutionResult({
            scriptId: this.script.id,
            output: this.output,
            error: response.error,
            status: 'FAILED',
            executionTime: executionTime
          }).subscribe({
            next: () => this.loadExecutions(),
            error: (err) => console.error('Erreur lors de la sauvegarde:', err)
          });
        } else {
          this.output += '\nRésultat: ' + response.output;
          const executionTime = response.executionTime ?? Math.round(performance.now() - startTime);
          this.executionService.saveExecutionResult({
            scriptId: this.script.id,
            output: response.output,
            status: 'SUCCESS',
            executionTime: executionTime
          }).subscribe({
            next: () => this.loadExecutions(),
            error: (err) => console.error('Erreur lors de la sauvegarde:', err)
          });
        }
      } else {
        throw new Error('Type de script non supporté');
      }
    } catch (error: any) {
      this.output += '\nErreur: ' + error.message;
      const executionTime = Math.round(performance.now() - startTime);
      this.executionService.saveExecutionResult({
        scriptId: this.script.id,
        output: this.output,
        error: error.message,
        status: 'FAILED',
        executionTime: executionTime
      }).subscribe({
        next: () => this.loadExecutions(),
        error: (err) => console.error('Erreur lors de la sauvegarde:', err)
      });
    } finally {
      this.isRunning = false;
    }
  }

  saveToFile() {
    if (!this.script.content) return;

    let extension = '.txt';
    switch (this.script.type) {
      case 'PYTHON': extension = '.py'; break;
      case 'R': extension = '.r'; break;
      case 'SQL': extension = '.sql'; break;
    }

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

  saveScript() {
    if (!this.script.title || !this.script.type || !this.script.createdBy || !this.script.content) {
      return;
    }

    this.scriptService.updateScript(this.scriptId, this.script).subscribe(() => {
      this.router.navigate(['/scripts']);
    });
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
}