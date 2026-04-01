import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs';

import { CardPedidoComponent } from '../../components/card-pedido/card-pedido';
import { IPedido } from '../../models/pedido.model';
import { VoluntariadoService } from '../../services/voluntariado';

@Component({
  selector: 'app-minhas-contribuicoes',
  standalone: true,
  imports: [CardPedidoComponent, RouterModule],
  templateUrl: './minhas-contribuicoes.html',
  styleUrl: './minhas-contribuicoes.css'
})
export class MinhasContribuicoesComponent implements OnInit {
  private voluntariadoService = inject(VoluntariadoService);
  private cdr = inject(ChangeDetectorRef);
  
  // Estado da Página
  minhasContribuicoes: IPedido[] = [];
  carregando: boolean = true;
  erro: string = '';

  ngOnInit(): void {
    this.carregarContribuicoes();
  }

  private carregarContribuicoes(): void {
    this.voluntariadoService.obterMinhasContribuicoes()
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges(); 
        })
      )
      .subscribe({
        next: (dados) => {
          this.minhasContribuicoes = dados;
        },
        error: (erro) => {
          console.error('Erro ao carregar contribuições:', erro);
          this.erro = 'Não foi possível carregar as tuas contribuições. Verifica a tua ligação.';
        }
      });
  }
}