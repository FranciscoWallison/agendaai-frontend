export interface Responsavel {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  criadoEm?: string;
}

export interface LoginResponse {
  accessToken: string;
  responsavel: Pick<Responsavel, 'id' | 'nome' | 'email'>;
}

export interface Paciente {
  id: string;
  responsavelId: string;
  nome: string;
  dataNascimento: string;
  sexo: 'M' | 'F' | 'O';
  observacoes?: string | null;
  ativo: boolean;
}

export interface Profissional {
  id: string;
  nome: string;
  crm: string;
  especialidade: string;
  telefone?: string | null;
  ativo: boolean;
}

export interface Servico {
  id: string;
  nome: string;
  duracaoMinutos: number;
  precoCentavos: number;
}

export interface SlotLivre {
  inicio: string;
  fim: string;
}

export type StatusAgendamento = 'AGENDADO' | 'CANCELADO' | 'CONCLUIDO';

export interface Agendamento {
  id: string;
  pacienteId: string;
  profissionalId: string;
  servicoId: string;
  dataHoraInicio: string;
  dataHoraFim: string;
  status: StatusAgendamento;
  observacoes?: string | null;
  criadoEm: string;
  canceladoEm: string | null;
  paciente?: Paciente;
  profissional?: Profissional;
  servico?: Servico;
}
