import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import {  ChartComponent, NgApexchartsModule } from "ng-apexcharts";

import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexTheme,
  ApexTitleSubtitle,
  ApexFill,
  ApexStroke,
  ApexYAxis,
  ApexLegend,
  ApexPlotOptions
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  theme: ApexTheme;
  title: ApexTitleSubtitle;
  fill: ApexFill,
  yaxis: ApexYAxis,
  stroke: ApexStroke,
  legend: ApexLegend,
  plotOptions: ApexPlotOptions
};

@Component({
  selector: 'app-areacharts2',
  standalone: true,
  imports: [NgApexchartsModule, CommonModule],
  templateUrl: './areacharts2.component.html',
  styleUrl: './areacharts2.component.scss'
})
export class Areacharts2Component {
 @ViewChild("chart") chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  // Données des scripts Python et Flask
  scriptsParType = {
    pythonScripts: 85,
    flaskScripts: 43,
    totalScripts: 128
  };

  constructor() {
    this.chartOptions = {
      series: [this.scriptsParType.pythonScripts, this.scriptsParType.flaskScripts],
        chart: {
          width: 300,
          height: 250,
          type: 'polarArea'
        },
        labels: ['Scripts Python', 'Scripts R'],
        fill: {
          opacity: 1
        },
        stroke: {
          width: 1,
          colors: undefined
        },
        yaxis: {
          show: false
        },
        legend: {
          position: 'bottom',
          fontSize: '12px'
        },
        plotOptions: {
          polarArea: {
            rings: {
              strokeWidth: 0
            }
          }
        },
        theme: {
          monochrome: {
            //    enabled: true,
            shadeTo: 'light',
            shadeIntensity: 0.6
          }
        }
    };
  }
}
