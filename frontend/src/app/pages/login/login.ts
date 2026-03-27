import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AuthError } from '@supabase/supabase-js';
import { Login, Registrar } from '../../models/auth.model'; 

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {
  isLoginMode: boolean = true;

  authForm: FormGroup = new FormGroup({
    nome: new FormControl<string | null>(''),
    email: new FormControl<string | null>('', [Validators.required, Validators.email]),
    password: new FormControl<string | null>('', [Validators.required, Validators.minLength(6)])
  });

  constructor(private authService: AuthService, private router: Router) {}

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

  async onSubmit(): Promise<void> {
    if (this.authForm.invalid) return;

    try {
      if (this.isLoginMode) {
        const loginData: Login = {
          email: this.authForm.value.email ?? '',
          password: this.authForm.value.password ?? ''
        };

        const { error } = await this.authService.login(loginData);
        if (error) throw error; 
        
        alert('Login com sucesso!');
        this.router.navigate(['/dashboard']);

      } else {
        const registerData: Registrar = {
          email: this.authForm.value.email ?? '',
          password: this.authForm.value.password ?? '',
          nome: this.authForm.value.nome ?? ''
        };
        const { data, error } = await this.authService.registar(registerData);
        if (error) throw error;
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          throw new Error('Este email já se encontra registado na plataforma.');
        }
        alert('Conta criada com sucesso! Verifica o teu email ou faz login.');
        this.toggleMode();
      }
    
    } catch (error: unknown) { 
      if (error instanceof Error || (error as AuthError).message) {
        alert('Erro: ' + (error as AuthError).message);
      } else {
        alert('Ocorreu um erro inesperado.');
      }
    }
  }
}