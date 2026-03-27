// O que nós enviamos para o nosso Serviço (Os nossos DTOs)
export interface Login {
  email: string;
  password: string;
}

// O Registo precisa do mesmo que o Login, mais o Nome!
export interface Registrar extends Login {
  nome: string; 
}