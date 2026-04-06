import { describe, it, expect } from 'vitest';
import { AuthService } from './auth';

describe('AuthService', () => {

  it('deve existir a classe AuthService', () => {
    expect(AuthService).toBeDefined();
    expect(typeof AuthService).toBe('function');
  });

  it('deve ser possível criar uma instância (sem DI)', () => {
    // Teste básico de estrutura da classe
    expect(AuthService.prototype.obterUtilizadorAtual).toBeDefined();
    expect(AuthService.prototype.login).toBeDefined();
    expect(AuthService.prototype.logout).toBeDefined();
  });

  it('deve ter métodos públicos esperados', () => {
    const methodNames = Object.getOwnPropertyNames(AuthService.prototype);
    expect(methodNames).toContain('obterUtilizadorAtual');
    expect(methodNames).toContain('login');
    expect(methodNames).toContain('logout');
  });
});