import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadScriptComponent } from './upload-script.component';

describe('UploadScriptComponent', () => {
  let component: UploadScriptComponent;
  let fixture: ComponentFixture<UploadScriptComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadScriptComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadScriptComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
