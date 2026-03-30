import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap, map } from 'rxjs';
import { IPedido, ICriarPedido } from '../models/pedido.model';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  
  private readonly apiUrl = 'https://integrabridge-api.onrender.com/api/pedidos';

  /**
   * Método privado para centralizar a lógica de autenticação.
   * Segue o DRY (Don't Repeat Yourself).
   */
  private getAuthHeaders(): Observable<HttpHeaders> {
    return from(this.authService.supabase.auth.getSession()).pipe(
      map(({ data }) => {
        const token = data.session?.access_token;
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
}