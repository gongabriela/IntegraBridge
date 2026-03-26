import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  isLoginMode: boolean = true;
  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
  }
}
