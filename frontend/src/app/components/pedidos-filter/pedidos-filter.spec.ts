import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PedidosFilter } from './pedidos-filter';

describe('PedidosFilter', () => {
  let component: PedidosFilter;
  let fixture: ComponentFixture<PedidosFilter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PedidosFilter],
    }).compileComponents();

    fixture = TestBed.createComponent(PedidosFilter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
