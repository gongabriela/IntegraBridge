import { describe, it, expect } from 'vitest';
import { Login, Registrar } from './auth.model';

describe('Auth Models', () => {
  it('deve criar um objeto Login válido', () => {
    const login: Login = {
      email: 'test@test.com',
      password: '123456'
    };

    expect(login.email).toBe('test@test.com');
    expect(login.password).toBe('123456');
  });

  it('deve criar um objeto Registrar válido', () => {
    const registro: Registrar = {
      nome: 'João Silva',
      email: 'joao@test.com', 
      password: 'senha123'
    };

    expect(registro.nome).toBe('João Silva');
    expect(registro.email).toBe('joao@test.com');
  });

  it('deve ter estruturas corretas', () => {
    const login: Login = { email: 'a@b.com', password: '123' };
    const registro: Registrar = { nome: 'test', email: 'a@b.com', password: '123' };
    
    expect(Object.keys(login)).toContain('email');
    expect(Object.keys(registro)).toContain('nome');
  });
});