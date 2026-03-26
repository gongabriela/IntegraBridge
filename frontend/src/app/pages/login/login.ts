import { Component } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, NgModel, Form } from '@angular/forms';
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  isLoginMode: boolean = true;

  authForm: FormGroup = new FormGroup({
    nome: new FormControl(''),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(6)]),
  });

  toggleMode(): void {
    this.isLoginMode = !this.isLoginMode;
    this.authForm.reset();

    const nomeControl = this.authForm.get('nome');
    if (!nomeControl) return;
    if (this.isLoginMode) {
      nomeControl.clearValidators();
    } else {
      nomeControl.setValidators(Validators.required);
    }
    nomeControl.updateValueAndValidity();
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      alert('Por favor, preencha todos os campos corretamente.'); //APAGAR ISSO
    }
    const { nome, email, password } = this.authForm.value;
    console.log('Formulário enviado:', { nome, email, password }); //APAGAR ISSO
  } 
}
