import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Areacharts1Component } from './areacharts1.component';

describe('Areacharts1Component', () => {
  let component: Areacharts1Component;
  let fixture: ComponentFixture<Areacharts1Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Areacharts1Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Areacharts1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
