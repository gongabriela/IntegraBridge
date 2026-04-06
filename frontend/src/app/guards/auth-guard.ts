import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

/**
 * Guard de autenticação para proteger rotas privadas.
 * Verifica se utilizador está autenticado antes de permitir acesso.
 * Redireciona para /login se não autenticado.
 */
export const authGuard: CanActivateFn = async () => {

  const authService = inject(AuthService);
  const router = inject(Router);

  const user = await authService.obterUtilizadorAtual();

  if (user) {
    return true; 
  } else {
    router.navigate(['/login']);
    return false; 
  }
};