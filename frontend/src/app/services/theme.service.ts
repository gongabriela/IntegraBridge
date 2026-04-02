import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'integra-bridge-theme';
  private currentThemeSubject = new BehaviorSubject<Theme>('auto');
  
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.initTheme();
  }

  /**
   * Alterna entre light e dark mode.
   */
  toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    const newTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Define o tema específico e aplica imediatamente.
   */
  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Retorna o tema atual.
   */
  getTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Inicializa o tema carregando do localStorage.
   * Se não houver preferência salva, usa 'auto' (system preference).
   */
  private initTheme(): void {
    const savedTheme = this.loadTheme();
    this.currentThemeSubject.next(savedTheme);
    this.applyTheme(savedTheme);
  }

  /**
   * Aplica o tema manipulando classes do DOM.
   * - 'light': adiciona .light-theme ao body
   * - 'dark': adiciona .dark-theme ao body  
   * - 'auto': remove classes (usa @media prefers-color-scheme)
   */
  private applyTheme(theme: Theme): void {
    const body = document.body;
    
    body.classList.remove('light-theme', 'dark-theme');
    
    if (theme === 'light') {
      body.classList.add('light-theme');
    } else if (theme === 'dark') {
      body.classList.add('dark-theme');
    }
  }

  /**
   * Persiste o tema no localStorage.
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * Carrega o tema do localStorage.
   * Fallback para 'auto' se não existir ou for inválido.
   */
  private loadTheme(): Theme {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY) as Theme;
      if (saved && ['light', 'dark', 'auto'].includes(saved)) {
        return saved;
      }
    } catch (error) {
      console.warn('Failed to load theme preference:', error);
    }
    
    return 'auto';
  }
}