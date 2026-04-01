import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, from, switchMap, map, catchError, of } from 'rxjs';
import { IContacto } from '../models/contacto.model';
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
}
