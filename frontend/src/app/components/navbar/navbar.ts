import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class NavbarComponent {
  @Input() title = 'IntegraBridge';
  @Input() description = '';
  @Output() toggleSidebar = new EventEmitter<void>();
}