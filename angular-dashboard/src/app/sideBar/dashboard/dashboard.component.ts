import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgApexchartsModule } from 'ng-apexcharts';
import { LineChartComponent } from '../charts/line-chart/line-chart.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule,LineChartComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  totalScripts = 128;
  executedScripts = 96;
  failedScripts = 7;
  uploadedScripts = 25;

  displayTotalScripts = 0;
  displayExecutedScripts = 0;
  displayFailedScripts = 0;
  displayUploadedScripts = 0;

  ngOnInit(): void {
    this.animateValue(0, this.totalScripts, v => this.displayTotalScripts = v, 1000);
    this.animateValue(0, this.executedScripts, v => this.displayExecutedScripts = v, 1000);
    this.animateValue(0, this.failedScripts, v => this.displayFailedScripts = v, 1000);
    this.animateValue(0, this.uploadedScripts, v => this.displayUploadedScripts = v, 1000);
  }

  private animateValue(start: number, end: number, setter: (value: number) => void, durationMs: number = 1200): void {
    const startTime = performance.now();
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = this.easeOutCubic(progress);
      const currentValue = Math.round(start + (end - start) * eased);
      setter(currentValue);
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}
