import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexYAxis,
  ApexLegend,
  ApexFill,
  NgApexchartsModule
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  yaxis: ApexYAxis;
  colors: string[];
  legend: ApexLegend;
  fill: ApexFill;
};

@Component({
  selector: 'app-line-chart',
  imports: [NgApexchartsModule, CommonModule],
  standalone: true,
  templateUrl: './line-chart.component.html',
  styleUrl: './line-chart.component.scss'
})
export class LineChartComponent {
 @ViewChild("chart") chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;

  // Données des scripts échoués et réussis
  scriptsStatus = {
    scriptsReussis: 96,
    scriptsEchoues: 7,
    totalScripts: 103
  };

  constructor() {
    this.chartOptions = {
      series: [
        {
          name: "Scripts Réussis",
          data: this.generateScriptStatusData(20, this.scriptsStatus.scriptsReussis, 0.8)
        },
        {
          name: "Scripts Échoués",
          data: this.generateScriptStatusData(20, this.scriptsStatus.scriptsEchoues, 0.3)
        }
      ],
      chart: {
        type: "area",
        height: 300,
        stacked: true,
        events: {
          selection: function(chart, e) {
            console.log(new Date(e.xaxis.min));
          }
        }
      },
      colors: ["#10B981", "#EF4444"],
      dataLabels: {
        enabled: false
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.6,
          opacityTo: 0.8
        }
      },
      legend: {
        position: "top",
        horizontalAlign: "left"
      },
      xaxis: {
        type: "datetime"
      }
    };
  }

  public generateScriptStatusData = function(count, baseValue, variation) {
    var i = 0;
    var series = [];
    var baseTime = new Date("2024-01-01").getTime();

    while (i < count) {
      var x = baseTime + (i * 86400000); // +1 jour
      var variationFactor = 0.5 + (Math.random() * variation);
      var y = Math.round(baseValue * variationFactor);

      series.push([x, y]);
      i++;
    }
    return series;
  };
}
