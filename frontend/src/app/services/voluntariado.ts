import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, switchMap, map, catchError, of } from 'rxjs';
import { IContacto } from '../models/contacto.model';
import { IPedido } from '../models/pedido.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class VoluntariadoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly apiUrl = 'http://localhost:3000/api/voluntariado';

  /**
   * Método privado para centralizar a lógica de autenticação.
   * Segue o DRY (Don't Repeat Yourself).
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.authService.obterSessaoAtual()).pipe(
      map((session) => {
        const token = session?.access_token;
        if (!token) {
          console.warn('VoluntariadoService: Nenhum token de sessão encontrado.');
        }
        return new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });
      })
    );
  }

  /**
   * Obtém as informações de contacto do parceiro (dono ou helper) de um pedido.
   * 
   * Apenas utilizadores autorizados (dono ou helper do pedido) podem aceder.
   * O pedido deve estar em status 'em_progresso' ou 'concluido'.
   * 
   * @param pedidoId UUID do pedido
   * @returns Observable com os dados de contacto do parceiro (IContacto) ou null se não autorizado
   */
  obterContactoParceiro(pedidoId: string): Observable<IContacto | null> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) => 
        this.http.get<IContacto>(`${this.apiUrl}/contacto/${pedidoId}`, { headers })
      ),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 403) {
          console.warn('VoluntariadoService: Não autorizado a ver contacto deste pedido.');
          return of(null);
        }
        console.error('VoluntariadoService: Erro ao obter contacto:', error.message);
        throw error;
      })
    );
  }

  /**
   * Oferece ajuda num pedido pendente.
   * Ao executar, o utilizador atual torna-se o helper do pedido e o status muda para 'em_progresso'.
   * 
   * @param pedidoId UUID do pedido
   * @returns Observable com o pedido atualizado (IPedido)
   */
  oferecerAjuda(pedidoId: string): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.post<IPedido>(`${this.apiUrl}/ajudar/${pedidoId}`, {}, { headers })
      )
    );
  }

  /**
   * Obtém a lista de pedidos criados pelo utilizador atual (onde user_id = currentUser).
   * 
   * @returns Observable com array de pedidos do utilizador (IPedido[])
   */
  obterMeusPedidos(): Observable<IPedido[]> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<IPedido[]>(`${this.apiUrl}/meus-pedidos`, { headers })
      )
    );
  }

  /**
   * Obtém a lista de pedidos onde o utilizador atual é helper (onde helper_id = currentUser).
   * 
   * @returns Observable com array de contribuições do utilizador (IPedido[])
   */
  obterMinhasContribuicoes(): Observable<IPedido[]> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.get<IPedido[]>(`${this.apiUrl}/minhas-contribuicoes`, { headers })
      )
    );
  }

  /**
   * Marca um pedido como concluído.
   * Apenas o dono do pedido (user_id) pode executar esta ação.
   * O pedido deve estar em status 'em_progresso'.
   * 
   * @param pedidoId UUID do pedido
   * @returns Observable com o pedido atualizado (IPedido)
   */
  marcarComoConcluido(pedidoId: string): Observable<IPedido> {
    return this.getAuthHeaders().pipe(
      switchMap((headers) =>
        this.http.patch<IPedido>(`${this.apiUrl}/concluir/${pedidoId}`, {}, { headers })
      )
    );
  }
}