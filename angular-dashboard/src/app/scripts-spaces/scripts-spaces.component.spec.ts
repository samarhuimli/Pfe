import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptsSpacesComponent } from './scripts-spaces.component';

describe('ScriptsSpacesComponent', () => {
  let component: ScriptsSpacesComponent;
  let fixture: ComponentFixture<ScriptsSpacesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptsSpacesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScriptsSpacesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
