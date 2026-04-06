import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, map } from 'rxjs';
import { IPedido, ICriarPedido, IDistrito, IIdioma } from '../models/pedido.model';
import { AuthService } from './auth';

/**
 * Serviço para operações CRUD de pedidos de ajuda.
 * Gere comunicação com API backend via HttpClient.
 * Todos os requests incluem autenticação JWT via getAuthHeaders().
 */
@Injectable({ providedIn: 'root' })

export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly apiUrl = 'https://integrabridge-api.onrender.com/api/pedidos';
  private readonly lookupUrl = 'https://integrabridge-api.onrender.com/api/lookups';
  
  //private readonly apiUrl = 'http://localhost:3000/api/pedidos';
  //private readonly lookupUrl = 'http://localhost:3000/api/lookups';

  /**
   * Obtém headers HTTP com token JWT para autenticação.
   * Centraliza lógica de autenticação (padrão DRY).
   * @returns Observable de HttpHeaders com Authorization Bearer token
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.authService.obterSessaoAtual()).pipe(
      map((session) => {
        const token = session?.access_token;
        if (!token) {
          console.warn('PedidoService: Nenhum token de sessão encontrado.');
        }
        return new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
      })
    );
  }

  /**
   * Lista todos os pedidos de ajuda com JOINs de distritos e idiomas.
   * @returns Observable de array de pedidos completos
   */
  obterPedidos(): Observable<IPedido[]> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<IPedido[]>(this.apiUrl, { headers }))
    );
  }

  /**
   * Cria um novo pedido de ajuda.
   * Backend adiciona user_id automaticamente via req.user.
   * @param novoPedido DTO com dados do formulário
   * @returns Observable do pedido criado com id e created_at
   */
  criarPedido(novoPedido: ICriarPedido): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => 
        this.http.post<IPedido>(this.apiUrl, novoPedido, { headers })
      )
    );
  }

  /**
   * Obtém lista de distritos para dropdown em formulários.
   * @returns Observable de array de distritos
   */
  obterDistritos(): Observable<IDistrito[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get<IDistrito[]>(`${this.lookupUrl}/distritos`, { headers }))
    );
  }

  /**
   * Obtém lista de idiomas para dropdown em formulários.
   * @returns Observable de array de idiomas
   */
  obterIdiomas(): Observable<IIdioma[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get<IIdioma[]>(`${this.lookupUrl}/idiomas`, { headers }))
    );
  }

  /**
   * Obtém detalhes completos de um pedido específico.
   * Usado em detalhe-pedido e editar-pedido para carregar dados.
   * @param id UUID do pedido
   * @returns Observable do pedido com JOINs de distritos e idiomas
   */
  obterPorId(id: string): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get<IPedido>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  /**
   * Atualiza um pedido existente.
   * Backend valida se req.user.id === pedido.user_id (apenas dono pode editar).
   * @param id UUID do pedido a atualizar
   * @param payload Dados parciais a atualizar (não precisa enviar todos os campos)
   * @returns Observable do pedido atualizado
   */
  atualizarPedido(id: string, payload: Partial<IPedido>): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.put<IPedido>(`${this.apiUrl}/${id}`, payload, { headers }))
    );
  }

  /**
   * Apaga um pedido permanentemente.
   * Backend valida se req.user.id === pedido.user_id (apenas dono pode apagar).
   * @param id UUID do pedido a apagar
   * @returns Observable void (204 No Content em caso de sucesso)
   */
  apagarPedido(id: string): Observable<void> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }))
    );
  }
}