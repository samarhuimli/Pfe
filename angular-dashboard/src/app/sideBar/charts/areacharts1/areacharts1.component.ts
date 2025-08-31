import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexStroke,
  ApexFill,
  NgApexchartsModule,
  ChartComponent
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  stroke: ApexStroke;
  fill: ApexFill;
  colors: string[];
  legend: any;
  plotOptions: any;
};

@Component({
  selector: 'app-areacharts1',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule],
  templateUrl: './areacharts1.component.html',
  styleUrl: './areacharts1.component.scss'
})
export class Areacharts1Component {
@ViewChild("chart") chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  // Statistiques du sandbox en français
  statistiquesSandbox = {
    totalScripts: 128,
    scriptsExecutes: 96,
    scriptsEchoues: 80,
    scriptsTelecharges: 69,
    scriptsSauvegardes: 48,
    tauxReussite: '87.5%',
    tempsExecutionMoyen: '2.3s'
  };

  constructor() {
    this.chartOptions = {
      series: [this.statistiquesSandbox.scriptsExecutes, this.statistiquesSandbox.scriptsEchoues, this.statistiquesSandbox.scriptsTelecharges, this.statistiquesSandbox.scriptsSauvegardes],
      labels: ["Scripts Exécutés", "Scripts Échoués", "Scripts Téléchargés", "Scripts Sauvegardés"],
      chart: {
        type: "polarArea",
        height: 350
      },
      colors: ["#10B981", "#EF4444", "#F59E0B", "#3B82F6"],
      stroke: {
        colors: ["#fff"],
        width: 2
      },
      fill: {
        opacity: 0.8
      },
      legend: {
        position: "bottom",
        horizontalAlign: "center"
      },
      plotOptions: {
        polarArea: {
          rings: {
            strokeWidth: 0
          },
          spokes: {
            strokeWidth: 0
          }
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: "bottom"
            }
          }
        }
      ]
    };
  }
}
