import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ScriptService, Script } from '../../services/script.service';
import { ExecutionService } from '../../services/execution.service';
import { ExecutionResultDTO } from 'src/app/models/execution-result.model';
import { ExecutionResultComponent } from '../../execution-result/execution-result.component';

declare function loadPyodide(config: {
  stdout?: (text: string) => void,
  stderr?: (text: string) => void
}): Promise<any>;

@Component({
  selector: 'app-script-view',
  standalone: true,
  imports: [CommonModule, ExecutionResultComponent],
  templateUrl: './script-view.component.html',
  styleUrls: ['./script-view.component.scss']
})
export class ScriptViewComponent implements OnInit {
  script!: Script;
  output: string = '';
  isRunning: boolean = false;
  pyodide: any = null;

  constructor(
    private route: ActivatedRoute,
    private scriptService: ScriptService,
    private executionService: ExecutionService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      const id = Number(idParam);
      this.scriptService.getScriptById(id).subscribe({
        next: (scriptData) => {
          this.script = scriptData;
          // On ne lance plus runCode() ici
        },
        error: (err) => {
          this.output = `Erreur lors du chargement du script : ${err.message}`;
        }
      });
    }
  }
  
  async runCode() {
    if (!this.script.content || this.script.type !== 'PYTHON') return;

    const startTime = performance.now();
    this.output = 'Exécution du code Python...\n';
    this.isRunning = true;

    try {
      if (!this.pyodide) {
        this.pyodide = await loadPyodide({
          stdout: (text: string) => this.output += text,
          stderr: (text: string) => this.output += text
        });
        await this.pyodide.loadPackage(['numpy']);
      }

      const result = await this.pyodide.runPython(this.script.content);
      if (result) {
        this.output += '\nRésultat: ' + result;
      }

      const executionTime = performance.now() - startTime;

      const executionResult: ExecutionResultDTO = {
        scriptId: this.script.id,
        output: this.output,
        status: 'SUCCESS',
        executionTime
      };

      this.executionService.saveExecutionResult(executionResult).subscribe();
    } catch (error: any) {
      this.output += '\nErreur: ' + error.message;

      const executionTime = performance.now() - startTime;

      const executionResult: ExecutionResultDTO = {
        scriptId: this.script.id,
        output: this.output,
        error: error.message,
        status: 'FAILED',
        executionTime
      };

      this.executionService.saveExecutionResult(executionResult).subscribe();
    } finally {
      this.isRunning = false;
    }
  }

  get success(): boolean {
    return !this.output.includes('Erreur:');
  }

  get error(): string {
    return this.success ? '' : this.output;
  }
}
