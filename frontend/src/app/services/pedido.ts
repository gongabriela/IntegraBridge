import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, switchMap } from 'rxjs';
import { IPedido } from '../models/pedido.model';
import { AuthService } from './auth'; // 1. Importa o teu AuthService

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  private authService = inject(AuthService); // 2. Injeta o serviço de Auth
  
  private apiUrl = 'https://integrabridge-api.onrender.com/api/pedidos';

  obterPedidos(): Observable<IPedido[]> {
    // 3. Usamos o cliente supabase que JÁ EXISTE dentro do teu AuthService
    return from(this.authService.supabase.auth.getSession()).pipe(
      switchMap(({ data }) => {
        const token = data.session?.access_token;
        
        console.log('Token recuperado para o pedido:', token ? token : 'Não (Vazio)');

        const headers = new HttpHeaders({
          'Authorization': `Bearer ${token}`
        });

        return this.http.get<IPedido[]>(this.apiUrl, { headers });
      })
    );
  }
}