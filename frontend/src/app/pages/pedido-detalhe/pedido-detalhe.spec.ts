import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidoDetalhe } from './pedido-detalhe';

describe('PedidoDetalhe', () => {
  let component: PedidoDetalhe;
  let fixture: ComponentFixture<PedidoDetalhe>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidoDetalhe],
    }).compileComponents();

    fixture = TestBed.createComponent(PedidoDetalhe);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
