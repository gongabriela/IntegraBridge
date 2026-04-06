import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AuthError } from '@supabase/supabase-js';
import { Login, Registrar } from '../../models/auth.model'; 
import { AlertModalComponent } from '../../components/alert-modal/alert-modal';

/**
 * Componente de autenticação (Login/Registo).
 * Alterna entre modos de login e registo.
 * Integra com AuthService e AlertModalComponent.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertModalComponent],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(NonNullableFormBuilder);
  private cdr = inject(ChangeDetectorRef);

  isLoginMode = true;
  
  mostrarAlert = false;

  alertConfig = { titulo: '', mensagem: '', tipo: 'sucesso' as 'sucesso' | 'erro', acao: 'nenhuma' };

  authForm = this.fb.group({
    nome: [''],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  /**
   * Alterna entre modo Login e Registo.
   * Limpa formulário e ajusta validações do campo 'nome'.
   */
  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.authForm.reset();

    const nomeControl = this.authForm.get('nome');
    if (nomeControl) {
      if (this.isLoginMode) {
        nomeControl.clearValidators();
      } else {
        nomeControl.setValidators([Validators.required]);
      }
      nomeControl.updateValueAndValidity();
    }
  }

  /**
   * Processa submissão do formulário (login ou registo).
   * Valida dados, chama AuthService, trata sucesso/erro com modais.
   */
  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) {
      this.authForm.markAllAsTouched();
      return;
    }

    try {
      const formData = this.authForm.getRawValue();

      if (this.isLoginMode) {
        const loginData: Login = {
          email: formData.email,
          password: formData.password
        };

        const { error } = await this.authService.login(loginData);
        if (error) throw error; 
        
        this.router.navigate(['/dashboard']);

      } else {
        const registerData: Registrar = {
          email: formData.email,
          password: formData.password,
          nome: formData.nome
        };
        
        const { data, error } = await this.authService.registar(registerData);
        if (error) throw error;
        
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Este email já se encontra registado na plataforma.');
        }
        
        this.alertConfig = {
          titulo: 'Conta Criada!',
          mensagem: 'A tua conta foi criada com sucesso. Verifica o teu email ou faz login para continuar.',
          tipo: 'sucesso',
          acao: 'mudar-para-login'
        };
        this.mostrarAlert = true;
        this.cdr.detectChanges();
      }
    
    } catch (error: unknown) { 
      let erroMsg = 'Ocorreu um erro inesperado.';
      if (error instanceof Error) erroMsg = error.message;
      else if ((error as AuthError).message) erroMsg = (error as AuthError).message;

      this.alertConfig = {
        titulo: 'Falha na Autenticação',
        mensagem: erroMsg,
        tipo: 'erro',
        acao: 'nenhuma'
      };
      this.mostrarAlert = true;
      this.cdr.detectChanges();
    }
  }

  /**
   * Callback ao fechar modal.
   * Se acao === 'mudar-para-login', alterna para modo login.
   */
  aoFecharAlert(): void {
    this.mostrarAlert = false;
    if (this.alertConfig.acao === 'mudar-para-login') {
      this.toggleMode();
    }
  }
}