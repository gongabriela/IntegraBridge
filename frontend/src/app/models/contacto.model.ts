export type ContactoRole = 'dono' | 'helper';

/**
 * Interface que representa a resposta do endpoint /api/voluntariado/contacto/:pedidoId
 * Contém as informações de contacto do parceiro (dono ou helper) num pedido.
 */
export interface IContacto {
  nome: string;
  email: string;
  telefone?: string;
  role: ContactoRole;
}

/**
 * Interface para representar erros de contacto
 * Usado quando o utilizador não tem permissão para ver contactos
 */
export interface IContactoError {
  erro: string;
  status?: number;
}

