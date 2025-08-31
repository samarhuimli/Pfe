import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Areacharts2Component } from './areacharts2.component';

describe('Areacharts2Component', () => {
  let component: Areacharts2Component;
  let fixture: ComponentFixture<Areacharts2Component>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Areacharts2Component]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Areacharts2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
