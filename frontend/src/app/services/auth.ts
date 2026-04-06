import { Injectable } from '@angular/core';
import { createClient, SupabaseClient, AuthResponse, User, AuthError, Session } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Login, Registrar } from '../models/auth.model'; 

/**
 * Serviço de autenticação usando Supabase Auth.
 * Abstrai operações de login, registo, logout e gestão de sessões.
 * Tokens JWT armazenados automaticamente em localStorage.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Cliente Supabase para operações de autenticação */
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  /**
   * Regista um novo utilizador.
   * NOTA: Se email já existe, retorna user com identities vazio (ver wiki).
   * @param dados Dados de registo (email, password, nome)
   * @returns AuthResponse com user e session
   */
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

  /**
   * Autentica utilizador existente.
   * Tokens armazenados automaticamente em localStorage.
   * @param dados Credenciais de login (email, password)
   * @returns AuthResponse com user e session
   */
  async login(dados: Login): Promise<AuthResponse> {
    return await this.supabase.auth.signInWithPassword({
      email: dados.email,
      password: dados.password
    });
  }

  /**
   * Termina sessão do utilizador.
   * Remove tokens do localStorage e invalida access_token no servidor.
   * @returns Objeto com error (null se sucesso)
   */
  async logout(): Promise<{ error: AuthError | null }> {
    return await this.supabase.auth.signOut();
  }

  /**
   * Obtém utilizador autenticado com validação no servidor.
   * Usado pelo AuthGuard para verificar autenticação.
   * @returns User se autenticado, null caso contrário
   */
  async obterUtilizadorAtual(): Promise<User | null> {
    const { data } = await this.supabase.auth.getUser();
    return data?.user ?? null;
  }

  /**
   * Obtém sessão atual do localStorage (sem validação servidor).
   * Usado para obter access_token para chamadas API.
   * @returns Session com tokens e dados do user, null se sem sessão
   */
  async obterSessaoAtual(): Promise<Session | null> {
    const { data, error } = await this.supabase.auth.getSession();
    if (error) {
      console.error('Erro ao recuperar sessão:', error.message);
      throw error;
    }
    return data.session;
  }

}