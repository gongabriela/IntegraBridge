import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'light' | 'dark' | 'auto';

/**
 * Service para gestão de temas light/dark mode com persistência.
 * Usa BehaviorSubject para reactive updates e localStorage para persistir preferência do user.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'integra-bridge-theme';
  private currentThemeSubject = new BehaviorSubject<Theme>('auto');
  
  /** Observable do tema atual para subscrição de componentes */
  currentTheme$ = this.currentThemeSubject.asObservable();

  constructor() {
    this.initTheme();
  }

  /**
   * Alterna entre light e dark mode.
   * Trata 'auto' como 'light' para o toggle (muda para dark).
   */
  toggleTheme(): void {
    const currentTheme = this.currentThemeSubject.value;
    const effectiveTheme = currentTheme === 'auto' ? 'light' : currentTheme;
    const newTheme: Theme = effectiveTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Define tema específico e aplica imediatamente.
   * Atualiza BehaviorSubject, DOM e localStorage.
   * @param theme - 'light', 'dark' ou 'auto'
   */
  setTheme(theme: Theme): void {
    this.currentThemeSubject.next(theme);
    this.applyTheme(theme);
    this.saveTheme(theme);
  }

  /**
   * Retorna o tema atual.
   * @returns Tema ativo ('light', 'dark' ou 'auto')
   */
  getTheme(): Theme {
    return this.currentThemeSubject.value;
  }

  /**
   * Inicializa tema carregando do localStorage.
   * Se não houver preferência salva, usa 'auto' (system preference @media).
   */
  private initTheme(): void {
    const savedTheme = this.loadTheme();
    this.currentThemeSubject.next(savedTheme);
    this.applyTheme(savedTheme);
  }

  /**
   * Aplica tema manipulando classes do DOM body.
   * - 'light': adiciona .light-theme ao body (força light)
   * - 'dark': adiciona .dark-theme ao body (força dark)
   * - 'auto': remove classes (usa @media prefers-color-scheme)
   * @param theme - Tema a aplicar
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
   * Persiste tema no localStorage.
   * Try-catch para graceful degradation (modo privado, quota exceeded).
   * @param theme - Tema a guardar
   */
  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, theme);
    } catch (error) {
      console.warn('Failed to save theme preference:', error);
    }
  }

  /**
   * Carrega tema do localStorage.
   * Valida que valor é 'light', 'dark' ou 'auto'. Fallback para 'auto' se inválido.
   * @returns Tema guardado ou 'auto' como fallback
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