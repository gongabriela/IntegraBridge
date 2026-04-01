import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinhasContribuicoes } from './minhas-contribuicoes';

describe('MinhasContribuicoes', () => {
  let component: MinhasContribuicoes;
  let fixture: ComponentFixture<MinhasContribuicoes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhasContribuicoes],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhasContribuicoes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
