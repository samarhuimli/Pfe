import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Importation corrigée
import { DatePipe } from '@angular/common';
import { ScriptService } from '../services/script.service';
import { ExecutionService } from '../services/execution.service';
import { ExecutionResultDTO } from 'src/app/models/execution-result.model';

// Définir l'interface ScriptForm avec un type compatible avec Script
interface ScriptForm {
  id?: number;
  title: string;
  createdBy: string;
  type: 'PYTHON' | 'R' | 'SQL'; // Aligné avec le type attendu par Script
  content: string;
}

@Component({
  selector: 'app-upload-script',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, RouterModule], // Ajout de RouterModule
  templateUrl: './upload-script.component.html',
  styleUrls: ['./upload-script.component.scss'],
  providers: [DatePipe]
})
export class UploadScriptComponent implements OnInit {
  form: ScriptForm = { title: '', createdBy: '', type: 'PYTHON', content: '' }; // Valeur par défaut pour type
  isEdit = false;
  isRunning = false;
  output: string = '';
  currentDate = new Date().toISOString();
  uploadedContent: { name: string; content: string } | null = null;

  constructor(
    private datePipe: DatePipe,
    private scriptService: ScriptService,
    private router: Router, // Injection corrigée
    private executionService: ExecutionService
  ) {}

  ngOnInit(): void {
    if (this.isEdit) {
      // Remplir form avec des données existantes si nécessaire
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.form.content = e.target?.result as string;
        this.uploadedContent = { name: file.name, content: this.form.content };
      };
      reader.readAsText(file);
    }
  }

  uploadFile(): void {
    if (this.form.content) {
      console.log('Fichier uploadé avec succès :', this.uploadedContent?.name);
    }
  }

  async runCode() {
    if (!this.form.content || !this.form.type) {
      this.output = 'Erreur: Aucun script ou type non sélectionné.';
      return;
    }

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
    try {
      const response = await this.executionService.executePythonCode(this.form.content, this.form.id).toPromise();
      if (response.status === 'SUCCESS') {
        this.output += '\nRésultat: ' + response.output;
      } else {
        this.output += '\nErreur: ' + response.error;
      }
    } catch (error: any) {
      this.output += '\nErreur: Échec de la connexion au serveur Python - ' + error.message;
      console.error('Erreur HTTP:', error);
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
      this.uploadedContent = null;
      this.output = '';
    }
  }

  submitForm(form: NgForm) {
    if (form.invalid) {
      Object.keys(form.controls).forEach(key => {
        form.controls[key].markAsTouched();
      });
      return;
    }

    if (this.isEdit && this.form.id) {
      this.scriptService.updateScript(this.form.id, { ...this.form } as any).subscribe(() => { // Cast temporaire
        this.saveScriptAndExecution();
        this.router.navigate(['/scripts']);
      });
    } else {
      this.scriptService.createScript({ ...this.form } as any).subscribe(newScript => { // Cast temporaire
        this.form.id = newScript.id;
        this.scriptService.addScriptToLocal(newScript);
        this.saveScriptAndExecution();
        this.router.navigate(['/scripts']);
      });
    }
  }

  private saveScriptAndExecution() {
    if (!this.form.title || !this.form.content) return;

    if (!this.isEdit && !this.form.id) {
      this.scriptService.createScript({ ...this.form } as any).subscribe(newScript => {
        this.form.id = newScript.id;
        this.scriptService.addScriptToLocal(newScript);
      });
    }

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
  }
}