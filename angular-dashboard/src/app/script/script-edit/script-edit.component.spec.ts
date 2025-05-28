import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScriptEditComponent } from './script-edit.component';

describe('ScriptEditComponent', () => {
  let component: ScriptEditComponent;
  let fixture: ComponentFixture<ScriptEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScriptEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ScriptEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
