import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthResponse, User, AuthError } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Login, Registrar } from '../models/auth.model'; 

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  async registar(dados: Registrar): Promise<AuthResponse> {
    return await this.supabase.auth.signUp({
      email: dados.email,
      password: dados.password,
      options: {
        data: {
          nome_completo: dados.nome
        }
      }
    });
  }

  async login(dados: Login): Promise<AuthResponse> {
    return await this.supabase.auth.signInWithPassword({
      email: dados.email,
      password: dados.password
    });
  }

  async logout(): Promise<{ error: AuthError | null }> {
    return await this.supabase.auth.signOut();
  }

  async obterUtilizadorAtual(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data?.user ?? null;
  }
}