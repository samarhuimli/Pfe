import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimelinechartComponent } from './timelinechart.component';

describe('TimelinechartComponent', () => {
  let component: TimelinechartComponent;
  let fixture: ComponentFixture<TimelinechartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimelinechartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimelinechartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
