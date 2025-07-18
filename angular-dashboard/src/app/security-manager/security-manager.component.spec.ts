import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecurityManagerComponent } from './security-manager.component';

describe('SecurityManagerComponent', () => {
  let component: SecurityManagerComponent;
  let fixture: ComponentFixture<SecurityManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecurityManagerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecurityManagerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
