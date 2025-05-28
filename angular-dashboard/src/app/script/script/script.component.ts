import { Component, OnInit } from '@angular/core';
import { ScriptService, Script } from '../../services/script.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-script',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './script.component.html',
})
export class ScriptComponent implements OnInit {
  mode: 'list' = 'list';
  scripts: Script[] = [];
  filteredScripts: Script[] = [];
  selectedScript: Script | null = null;

  // Filtres
  titleFilter: string = '';
  typeFilter: string = '';
  userFilter: string = '';

  // Options pour les filtres
  availableTypes: string[] = [];
  availableUsers: string[] = [];

  constructor(private scriptService: ScriptService, private router: Router) {}

  ngOnInit(): void {
    this.loadScripts();
    this.scriptService.getAllScriptsFromBackend();
  }

  loadScripts(): void {
    this.scriptService.getScriptsObservable().subscribe({
      next: (scripts) => {
        this.scripts = scripts;
        this.filteredScripts = [...scripts];
        this.updateFilterOptions();
        this.applyFilters(); // Applique les filtres après le chargement
      },
      error: (err) => console.error('Erreur lors du chargement des scripts', err)
    });
  }

  updateFilterOptions(): void {
    this.availableTypes = [...new Set(this.scripts.map(s => s.type))];
    this.availableUsers = [...new Set(this.scripts.map(s => s.createdBy))];
  }

  applyFilters(): void {
    this.filteredScripts = this.scripts.filter(script => {
      const matchesTitle = !this.titleFilter || 
        script.title.toLowerCase().includes(this.titleFilter.toLowerCase());
      const matchesType = !this.typeFilter || 
        script.type === this.typeFilter;
      const matchesUser = !this.userFilter || 
        script.createdBy === this.userFilter;
      
      return matchesTitle && matchesType && matchesUser;
    });
  }

  resetFilters(): void {
    this.titleFilter = '';
    this.typeFilter = '';
    this.userFilter = '';
    this.filteredScripts = [...this.scripts];
  }

  openViewModal(script: Script) {
    this.selectedScript = script;
    const modal = new (window as any).bootstrap.Modal(document.getElementById('viewScriptModal'));
    modal.show();
  }

  deleteScript(id: number) {
    this.scriptService.deleteScript(id).subscribe({
      next: () => {
        console.log('Script supprimé avec succès');
      },
      error: (err) => console.error('Erreur lors de la suppression', err)
    });
  }

  copyToClipboard(text: string) {
    if (text) {
      navigator.clipboard.writeText(text)
        .then(() => console.log('Texte copié !'))
        .catch(err => console.error('Erreur lors de la copie:', err));
    }
  }

  downloadScript() {
    const element = document.createElement('a');
    const file = new Blob(['Contenu du script'], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'script.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}