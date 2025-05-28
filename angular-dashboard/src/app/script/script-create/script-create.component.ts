import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';
import { Script, ScriptService } from '../../services/script.service';
import { ExecutionService } from '../../services/execution.service';
import { ExecutionResultComponent } from '../../execution-result/execution-result.component';
import { ExecutionResultDTO } from 'src/app/models/execution-result.model';
import { HttpClient } from '@angular/common/http';

declare function loadPyodide(config: {
  stdout?: (text: string) => void,
  stderr?: (text: string) => void
}): Promise<any>;

@Component({
  selector: 'app-script-create',
  standalone: true,
  imports: [CommonModule, FormsModule, ExecutionResultComponent],
  templateUrl: './script-create.component.html',
  styleUrls: ['./script-create.component.scss']
})
export class ScriptCreateComponent {
  executionResult = {
    title: 'Mon Script',
    success: false,
    output: 'Début de l\'exécution...\nCalcul terminé',
    error: 'Erreur: Division par zéro'
  };

  currentDate = new Date();

  @Input() form: Script = {
    title: '',
    content: '',
    createdBy: '',
    type: 'PYTHON'
  };

  @Input() isEdit = false;
  @Output() submitFormEvent = new EventEmitter<void>();
  @Output() cancelEvent = new EventEmitter<void>();

  output: string = '';
  isRunning: boolean = false;
  pyodide: any = null;

  constructor(
    private scriptService: ScriptService,
    private router: Router,
    private executionService: ExecutionService,
    private http: HttpClient
  ) {}

  async runCode() {
    if (!this.form.content || !this.form.type) return;

    const startTime = performance.now();
    this.isRunning = true;
    this.output = `Exécution du code ${this.form.type}...\n`;

    try {
      if (this.form.type === 'PYTHON') {
        await this.runPythonCode();
      } else if (this.form.type === 'R') {
        await this.runRCode();
      } else {
        throw new Error('Type de script non supporté');
      }

      const executionTime = performance.now() - startTime;
      this.output += `\nTemps d'exécution: ${executionTime} ms`;
    } catch (error: any) {
      this.output += '\nErreur: ' + error.message;
    } finally {
      this.isRunning = false;
    }
  }

  private async runPythonCode() {
    if (!this.pyodide) {
      this.pyodide = await loadPyodide({
        stdout: (text: string) => this.output += text + '\n',
        stderr: (text: string) => this.output += text + '\n'
      });
      await this.pyodide.loadPackage(['numpy']);
    }

    const result = await this.pyodide.runPython(this.form.content);
    if (result) {
      this.output += '\nRésultat: ' + result;
    }
  }

  private async runRCode() {
    try {
      const response = await this.executionService.executeRCode(this.form.content, this.form.id).toPromise();
      if (response.error) {
        this.output += '\nErreur: ' + response.error;
      } else {
        this.output += '\nRésultat: ' + response.output;
      }
    } catch (error: any) {
      this.output += '\nErreur: Échec de la connexion au serveur Spring - ' + error.message;
      console.error('Erreur HTTP:', error);
    }
  }

  saveToFile() {
    if (!this.form.content) return;

    const extension = this.form.type === 'R' ? 'R' : 'py';
    const filename = this.form.title ? `${this.form.title.replace(/[^a-z0-9]/gi, '_')}.${extension}` : `script.${extension}`;
    const blob = new Blob([this.form.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  clearEditor() {
    if (!this.form.content || confirm('Voulez-vous vraiment effacer le contenu ?')) {
      this.form.content = '';
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
      this.scriptService.updateScript(this.form.id!, this.form).subscribe(() => {
        this.saveScriptAndExecution();
        this.submitFormEvent.emit();
        this.router.navigate(['/scripts']);
      });
    } else {
      this.scriptService.createScript(this.form).subscribe(newScript => {
        this.form.id = newScript.id;
        this.scriptService.addScriptToLocal(newScript);
        this.saveScriptAndExecution();
        this.submitFormEvent.emit();
        this.router.navigate(['/scripts']);
      });
    }
  }

  private saveScriptAndExecution() {
    if (!this.form.title || !this.form.content) return;

    // Sauvegarder le script (si ce n'est pas déjà fait)
    if (!this.isEdit && !this.form.id) {
      this.scriptService.createScript(this.form).subscribe(newScript => {
        this.form.id = newScript.id;
        this.scriptService.addScriptToLocal(newScript);
      });
    }

    // Sauvegarder l'exécution
    if (this.output) {
      const executionResult: ExecutionResultDTO = {
        scriptId: this.form.id,
        output: this.output,
        status: this.output.includes('Erreur') ? 'FAILED' : 'SUCCESS',
        executionTime: Math.round(performance.now())
      };

      this.executionService.saveExecutionResult(executionResult).subscribe({
        next: () => console.log('Résultat sauvegardé avec succès'),
        error: (err) => console.error('Erreur lors de la sauvegarde:', err)
      });
    }
  }

  cancel() {
    this.router.navigate(['/scripts']);
    this.cancelEvent.emit();
  }
}