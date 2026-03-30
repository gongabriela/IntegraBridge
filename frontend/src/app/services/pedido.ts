import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPedido } from '../models/pedido.model';

@Injectable({ providedIn: 'root' })
export class PedidoService {
  private http = inject(HttpClient);
  
  // Usa o link do teu Render que está na tua documentação
  private apiUrl = 'https://integrabridge-api.onrender.com/api/pedidos';

  obterPedidos(): Observable<IPedido[]> {
    // Por agora, vamos usar o Token que tens no Postman
    const token = 'eyJhbGciOiJFUzI1NiIsImtpZCI6Ijg3YWM1YzA5LTdmMDItNGExMS04NWNiLTdjOWMyMWViNTljZSIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL3NjZm9veHh6Znlsc2R4amtlcmNhLnN1cGFiYXNlLmNvL2F1dGgvdjEiLCJzdWIiOiJmNWU0MWYxMC0zZWFhLTRkNjQtOWY2Ny01MzZmMmZlMzIzYzMiLCJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoxNzc0ODcxMTAzLCJpYXQiOjE3NzQ4Njc1MDMsImVtYWlsIjoiZ2FicmllbGFAZ2FicmllbGEuY29tIiwicGhvbmUiOiIiLCJhcHBfbWV0YWRhdGEiOnsicHJvdmlkZXIiOiJlbWFpbCIsInByb3ZpZGVycyI6WyJlbWFpbCJdfSwidXNlcl9tZXRhZGF0YSI6eyJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sInJvbGUiOiJhdXRoZW50aWNhdGVkIiwiYWFsIjoiYWFsMSIsImFtciI6W3sibWV0aG9kIjoicGFzc3dvcmQiLCJ0aW1lc3RhbXAiOjE3NzQ4Njc1MDN9XSwic2Vzc2lvbl9pZCI6IjQ4ZTQwNDU0LWFkODYtNGM2ZS1hMzZjLTE3MDk1ZTY2ZmMxMyIsImlzX2Fub255bW91cyI6ZmFsc2V9.4cfiLimBHHA3WBf9hJBcIZyll3jn9D1p611v-RrnH1Q-91BSzp2jxsJQt0i9aP7qaIE_-fp7VL88NEFQbaeLww'; 
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.get<IPedido[]>(this.apiUrl, { headers });
  }
}
