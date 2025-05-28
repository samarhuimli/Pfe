import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';


@Component({
  selector: 'app-scripts-spaces',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './scripts-spaces.component.html',
  styleUrls: ['./scripts-spaces.component.scss']
})
export class ScriptsSpacesComponent {
  templates = [
    {
      title: 'Python 2.7.12',
      description: 'Version historique de Python, souvent utilisée pour maintenir des projets anciens.',
      author: 'FinConnect ',
      code:'',
     
    },
    {
      title: 'Python 3.5.2',
      description: 'Première version de Python 3 à avoir gagné en adoption, avec une meilleure prise en charge de l’asynchrone.',
      author: 'FinConnect ',
      
    },
    {
      title: 'Python 3.12',
      description: 'Dernière version stable de Python avec des performances améliorées et des fonctionnalités modernes.',
      author: 'FinConnect ',
      
    },
    {
      title: 'R 4.1',
      description: 'Start with the latest stable R version.',
      author: 'FinConnect ',
    
    },
    {
      title: 'R 4.1',
      description: 'Start with the latest stable R version.',
      author: 'FinConnect ',
      
    },
    {
      title: 'R 4.1',
      description: 'Start with the latest stable R version.',
      author: 'FinConnect ',
     
    },
   
  ];

  selectedTemplate: string = '';
  output: string = '';
  

  constructor(private router: Router) {} // <-- Injecte Router

  useTemplate(code: string) {
    // Optionnel: sauvegarde dans localStorage
    localStorage.setItem('pythonTemplate', code);

    // Redirection vers création de script avec le template
    this.router.navigate(['/scripts/create'], { state: { templateCode: code } });
  }

  
}
