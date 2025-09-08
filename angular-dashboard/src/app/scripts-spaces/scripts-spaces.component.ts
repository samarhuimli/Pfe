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
      description: 'Version historique de Python, souvent utilisee pour maintenir des projets anciens.',
      author: 'FinConnect',
      code: '',
      type: 'PYTHON',
      version: '2.7.12'
    },
    {
      title: 'Python 3.5.2',
      description: 'Premiere version de Python 3 a avoir gagne en adoption, avec une meilleure prise en charge de l\'asynchrone.',
      author: 'FinConnect',
      code: '',
      type: 'PYTHON',
      version: '3.5.2'
    },
    {
      title: 'Python 3.12',
      description: 'Derniere version stable de Python avec des performances ameliorees et des fonctionnalites modernes.',
      author: 'FinConnect',
      code: '',
      type: 'PYTHON',
      version: '3.12'
    },
    {
      title: 'R 4.4.0',
      description: 'Start Already Tomorrow',
      author: 'FinConnect',
      code: '',
      type: 'R',
      version: '4.4.0'
    },
    {
      title: 'R 4.3.3',
      description: 'Angel Food Cake',
      author: 'FinConnect',
      code: '',
      type: 'R',
      version: '4.3.3'
    },
    {
      title: 'R 4.3.2',
      description: 'Shortstop Beagle',
      author: 'FinConnect',
      code: '',
      type: 'R',
      version: '4.3.2'
    }
  ];

  selectedTemplate: string = '';
  output: string = '';
  

  constructor(private router: Router) {} // <-- Injecte Router

  useTemplate(template: any) {
    // Save template info in localStorage
    localStorage.setItem('selectedTemplate', JSON.stringify(template));

    // Navigate to script creation with template data and script type
    this.router.navigate(['/scripts/create'], { 
      state: { 
        templateCode: template.code,
        scriptType: template.type,
        version: template.version,
        templateTitle: template.title
      } 
    });
  }

  
}
