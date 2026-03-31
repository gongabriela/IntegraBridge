import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalhePedido } from './detalhe-pedido';

describe('DetalhePedido', () => {
  let component: DetalhePedido;
  let fixture: ComponentFixture<DetalhePedido>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalhePedido],
    }).compileComponents();

    fixture = TestBed.createComponent(DetalhePedido);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
