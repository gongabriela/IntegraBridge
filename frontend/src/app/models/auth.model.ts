/**
 * Interface para dados de login.
 */
export interface Login {
  email: string;
  password: string;
}

/**
 * Interface para dados de registo.
 * Estende Login adicionando campo nome.
 */
export interface Registrar extends Login {
  nome: string; 
}