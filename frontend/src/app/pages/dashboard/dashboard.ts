import { Component, inject } from '@angular/core';
import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { IPedido } from '../../models/pedido.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CardPedidoComponent], // 2. Importamos o componente do cartão aqui
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {

  isSidebarOpen = false;

  meusPedidos: IPedido[] = [
    {
      id: '1',
      titulo: 'Legal Aid for Refugee Family',
      descricao: 'Assistance required for documentation and residency permits for a family of four.',
      status: 'urgent',
      categoria: 'Legal Aid',
      data: '2 hours ago'
    },
    {
      id: '2',
      titulo: 'Emergency Housing - Unit 4B',
      descricao: 'Immediate relocation needed due to structural damage in the current facility.',
      status: 'pending',
      categoria: 'Housing',
      data: '5 hours ago'
    },
    {
      id: '3',
      titulo: 'Medical Supply Distribution',
      descricao: 'Coordination of essential medicines for the community center in the south zone.',
      status: 'in-progress',
      categoria: 'Healthcare',
      data: '1 day ago'
    }
  ];

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}