import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MinhasContribuicoesComponent } from './minhas-contribuicoes';

describe('MinhasContribuicoesComponent', () => {
  let component: MinhasContribuicoesComponent;
  let fixture: ComponentFixture<MinhasContribuicoesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasContribuicoesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MinhasContribuicoesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});