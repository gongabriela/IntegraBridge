import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, map } from 'rxjs';
import { IPedido, ICriarPedido, IDistrito, IIdioma } from '../models/pedido.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  // Em vez de /api/lookup, fica apenas /api
  //private readonly apiUrl = 'https://integrabridge-api.onrender.com/api/pedidos';
  //private readonly baseUrl = 'https://integrabridge-api.onrender.com/api/lookups';
  
  private readonly apiUrl = 'http://localhost:3000/api/pedidos';
  private readonly lookupUrl = 'http://localhost:3000/api/lookups';
  /**
   * Método privado para centralizar a lógica de autenticação.
   * Segue o DRY (Don't Repeat Yourself).
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
   * Obtém a lista de todos os pedidos.
   */
  obterPedidos(): Observable<IPedido[]> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => this.http.get<IPedido[]>(this.apiUrl, { headers }))
    );
  }

  /**
   * Cria um novo pedido de ajuda.
   * @param novoPedido Objeto do tipo ICriarPedido (DTO)
   * @returns Observable do pedido criado (IPedido)
   */
  criarPedido(novoPedido: ICriarPedido): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => 
        this.http.post<IPedido>(this.apiUrl, novoPedido, { headers })
      )
    );
  }

  // --- Operações de Tabelas de Apoio (Lookups) ---
  obterDistritos(): Observable<IDistrito[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get<IDistrito[]>(`${this.lookupUrl}/distritos`, { headers }))
    );
  }

  obterIdiomas(): Observable<IIdioma[]> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get<IIdioma[]>(`${this.lookupUrl}/idiomas`, { headers }))
    );
  }

/**
   * Obtém os detalhes completos de um pedido específico.
   */
  obterPorId(id: string): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.get<IPedido>(`${this.apiUrl}/${id}`, { headers }))
    );
  }

  /**
   * Atualiza um pedido existente. 
   * Usamos Partial<IPedido> para podermos enviar apenas o que mudou.
   */
  atualizarPedido(id: string, payload: Partial<IPedido>): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.put<IPedido>(`${this.apiUrl}/${id}`, payload, { headers }))
    );
  }

  /**
   * Apaga um pedido permanentemente da base de dados.
   */
  apagarPedido(id: string): Observable<void> {
    return this.getAuthHeaders().pipe(
      switchMap(headers => this.http.delete<void>(`${this.apiUrl}/${id}`, { headers }))
    );
  }
}