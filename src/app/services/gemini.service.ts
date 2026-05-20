import { Injectable } from '@angular/core';
import {
  Content,
  FunctionCall,
  FunctionDeclaration,
  GoogleGenAI,
  Type,
} from '@google/genai';

import { ApiService } from './api.service';
import { StorageService } from './storage.service';
import { ChatMessage } from '../models/chat.models';

const KEY_GEMINI = 'agendaai.gemini.apiKey';
const MODEL = 'gemini-2.5-flash';

const SYSTEM_INSTRUCTION = `
Voce e o assistente do agendaAI, um app de agendamento de consultas pediatricas.
- Responda em portugues do Brasil de forma curta e direta.
- Sempre use as ferramentas (functions) disponiveis para consultar/alterar dados.
- Quando o usuario der nomes (ex: "marca pra Joao com a Dra. Marina"), primeiro liste pacientes/profissionais/servicos para resolver os IDs. Nunca invente IDs.
- Para criar agendamento, voce precisa de: pacienteId, profissionalId, servicoId, dataHoraInicio (ISO 8601 com timezone). Se faltar dado, pergunte.
- Para "amanha", "hoje", "proxima segunda" etc, calcule a data ISO a partir de hoje (que e ${new Date().toISOString()}).
- Confirme acoes destrutivas (cancelar, remover) antes de executar.
`.trim();

/**
 * Wrapper sobre @google/genai com function calling para o agendaAI.
 *
 * Estrategia:
 *  - tools[]: 10 declarations apontando para os endpoints do ApiService.
 *  - Em cada turn, Gemini decide se chama uma function. Loop ate ele retornar texto.
 *  - Historico (Content[]) preserva contexto entre mensagens da mesma sessao.
 */
@Injectable({ providedIn: 'root' })
export class GeminiService {
  private client: GoogleGenAI | null = null;
  private apiKeyCached: string | null = null;
  private history: Content[] = [];

  constructor(
    private storage: StorageService,
    private api: ApiService,
  ) {}

  // ---------- API key ----------

  async setApiKey(key: string) {
    const trimmed = key.trim();
    await this.storage.set(KEY_GEMINI, trimmed);
    this.apiKeyCached = trimmed;
    this.client = new GoogleGenAI({ apiKey: trimmed });
  }

  async getApiKey(): Promise<string | null> {
    if (this.apiKeyCached) return this.apiKeyCached;
    const k = await this.storage.get<string>(KEY_GEMINI);
    this.apiKeyCached = k;
    return k;
  }

  async clearApiKey() {
    await this.storage.remove(KEY_GEMINI);
    this.apiKeyCached = null;
    this.client = null;
    this.history = [];
  }

  async hasApiKey(): Promise<boolean> {
    return !!(await this.getApiKey());
  }

  private async ensureClient(): Promise<GoogleGenAI> {
    if (this.client) return this.client;
    const key = await this.getApiKey();
    if (!key) {
      throw new Error('API key do Gemini nao configurada. Va em Settings.');
    }
    this.client = new GoogleGenAI({ apiKey: key });
    return this.client;
  }

  // ---------- Teste de conexao ----------

  async testarConexao(): Promise<{ ok: true } | { ok: false; erro: string }> {
    try {
      const c = await this.ensureClient();
      await c.models.generateContent({
        model: MODEL,
        contents: 'ping',
        config: { maxOutputTokens: 5 },
      });
      return { ok: true };
    } catch (e: any) {
      return { ok: false, erro: e?.message ?? 'Falha desconhecida' };
    }
  }

  // ---------- Chat ----------

  resetHistory() {
    this.history = [];
  }

  /**
   * Envia uma mensagem do usuario.
   * Retorna stream de mensagens (user, tool-calls e a resposta final do model)
   * via callback `onMessage`, pra UI atualizar progressivamente.
   */
  async enviarMensagem(
    texto: string,
    onMessage: (m: ChatMessage) => void,
  ): Promise<void> {
    const client = await this.ensureClient();

    // 1. Adiciona msg do user no historico + UI
    this.history.push({ role: 'user', parts: [{ text: texto }] });
    onMessage({ role: 'user', text: texto });

    // 2. Loop de function-calling. Limite de seguranca: 8 hops.
    for (let hop = 0; hop < 8; hop++) {
      const resp = await client.models.generateContent({
        model: MODEL,
        contents: this.history,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ functionDeclarations: TOOLS }],
        },
      });

      const calls: FunctionCall[] = resp.functionCalls ?? [];
      const text = resp.text ?? '';

      // 2a. Sem function call -> resposta final
      if (calls.length === 0) {
        this.history.push({
          role: 'model',
          parts: [{ text: text || '(sem resposta)' }],
        });
        onMessage({ role: 'model', text: text || '(sem resposta)' });
        return;
      }

      // 2b. Salva o functionCall do modelo no historico
      this.history.push({
        role: 'model',
        parts: calls.map((c) => ({ functionCall: c })),
      });

      // 2c. Executa cada call e devolve functionResponse
      const responseParts: Array<{
        functionResponse: {
          name: string;
          response: Record<string, unknown>;
        };
      }> = [];
      for (const call of calls) {
        onMessage({
          role: 'tool',
          text: this.descreverChamada(call),
          toolName: call.name,
          loading: true,
        });
        let result: unknown;
        try {
          result = await this.executar(call);
        } catch (e: any) {
          result = { error: e?.message ?? String(e) };
        }
        responseParts.push({
          functionResponse: {
            name: call.name ?? 'unknown',
            response: { value: result },
          },
        });
      }

      // 2d. Manda os resultados pro Gemini e continua o loop
      this.history.push({ role: 'user', parts: responseParts });
    }

    onMessage({
      role: 'model',
      text: 'Operacao interrompida (muitos hops).',
    });
  }

  // ---------- Dispatcher ----------

  private async executar(call: FunctionCall): Promise<unknown> {
    const name = call.name ?? '';
    const args = (call.args ?? {}) as Record<string, any>;

    switch (name) {
      case 'listarPacientes':
        return this.api.listarPacientes();
      case 'criarPaciente':
        return this.api.criarPaciente({
          nome: args['nome'],
          dataNascimento: args['dataNascimento'],
          sexo: args['sexo'] ?? 'O',
          observacoes: args['observacoes'],
        });
      case 'removerPaciente':
        return this.api.removerPaciente(args['pacienteId']);

      case 'listarProfissionais':
        return this.api.listarProfissionais();
      case 'listarServicos':
        return this.api.listarServicos();
      case 'verHorariosDisponiveis':
        return this.api.listarSlots(
          args['profissionalId'],
          args['data'],
          args['servicoId'],
        );

      case 'criarAgendamento':
        return this.api.criarAgendamento({
          pacienteId: args['pacienteId'],
          profissionalId: args['profissionalId'],
          servicoId: args['servicoId'],
          dataHoraInicio: args['dataHoraInicio'],
          observacoes: args['observacoes'],
        });
      case 'listarProximosAgendamentos': {
        const agora = new Date();
        const list = await this.api.listarAgendamentos();
        return list
          .filter((a) => a.status === 'AGENDADO')
          .filter((a) => new Date(a.dataHoraInicio) >= agora)
          .sort((a, b) => a.dataHoraInicio.localeCompare(b.dataHoraInicio));
      }
      case 'cancelarAgendamento':
        return this.api.cancelarAgendamento(args['agendamentoId']);
      case 'agendaDoDia': {
        const data: string = args['data'];
        const list = await this.api.listarAgendamentos();
        return list.filter((a) => a.dataHoraInicio.startsWith(data));
      }

      default:
        return { error: `Funcao desconhecida: ${name}` };
    }
  }

  private descreverChamada(call: FunctionCall): string {
    const args = JSON.stringify(call.args ?? {});
    const txt = args.length > 80 ? args.slice(0, 77) + '…' : args;
    return `${call.name}(${txt})`;
  }
}

// ----------------------------------------------------------------
// FunctionDeclarations: cada uma vira uma "tool" pro Gemini.
// As descriptions DEVEM ser explicitas — o Gemini usa elas pra mapear
// linguagem natural em chamadas.
// ----------------------------------------------------------------
const TOOLS: FunctionDeclaration[] = [
  {
    name: 'listarPacientes',
    description:
      'Lista todas as criancas (pacientes) cadastradas pelo responsavel logado.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'criarPaciente',
    description: 'Cadastra uma nova crianca como paciente do responsavel.',
    parameters: {
      type: Type.OBJECT,
      required: ['nome', 'dataNascimento'],
      properties: {
        nome: { type: Type.STRING, description: 'Nome completo da crianca.' },
        dataNascimento: {
          type: Type.STRING,
          description: 'Data de nascimento no formato YYYY-MM-DD.',
        },
        sexo: {
          type: Type.STRING,
          description: 'M (masculino), F (feminino) ou O (outro). Padrao O.',
        },
        observacoes: {
          type: Type.STRING,
          description: 'Observacoes clinicas opcionais.',
        },
      },
    },
  },
  {
    name: 'removerPaciente',
    description:
      'Remove (soft-delete) uma crianca da lista de pacientes do responsavel.',
    parameters: {
      type: Type.OBJECT,
      required: ['pacienteId'],
      properties: {
        pacienteId: { type: Type.STRING, description: 'UUID do paciente.' },
      },
    },
  },
  {
    name: 'listarProfissionais',
    description: 'Lista os pediatras disponiveis para agendamento.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'listarServicos',
    description:
      'Lista os tipos de atendimento (consulta de rotina, retorno, vacinacao, etc) com duracao em minutos.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'verHorariosDisponiveis',
    description:
      'Lista os horarios (slots) livres de um pediatra em uma data para um servico especifico. A duracao do servico define o tamanho do slot.',
    parameters: {
      type: Type.OBJECT,
      required: ['profissionalId', 'data', 'servicoId'],
      properties: {
        profissionalId: { type: Type.STRING, description: 'UUID do pediatra.' },
        data: {
          type: Type.STRING,
          description: 'Data no formato YYYY-MM-DD.',
        },
        servicoId: { type: Type.STRING, description: 'UUID do servico.' },
      },
    },
  },
  {
    name: 'criarAgendamento',
    description:
      'Cria um novo agendamento. Use depois de resolver paciente, profissional, servico e horario.',
    parameters: {
      type: Type.OBJECT,
      required: ['pacienteId', 'profissionalId', 'servicoId', 'dataHoraInicio'],
      properties: {
        pacienteId: { type: Type.STRING, description: 'UUID da crianca.' },
        profissionalId: { type: Type.STRING, description: 'UUID do pediatra.' },
        servicoId: { type: Type.STRING, description: 'UUID do servico.' },
        dataHoraInicio: {
          type: Type.STRING,
          description:
            'Inicio em ISO 8601 com timezone (ex: 2026-05-20T13:00:00.000Z).',
        },
        observacoes: {
          type: Type.STRING,
          description: 'Observacoes opcionais.',
        },
      },
    },
  },
  {
    name: 'listarProximosAgendamentos',
    description:
      'Lista os proximos agendamentos do responsavel (futuros, status AGENDADO) ordenados por data.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'cancelarAgendamento',
    description:
      'Cancela um agendamento (soft-cancel). O agendamento fica no historico marcado como CANCELADO.',
    parameters: {
      type: Type.OBJECT,
      required: ['agendamentoId'],
      properties: {
        agendamentoId: { type: Type.STRING, description: 'UUID do agendamento.' },
      },
    },
  },
  {
    name: 'agendaDoDia',
    description:
      'Lista todos os agendamentos do responsavel em uma data especifica.',
    parameters: {
      type: Type.OBJECT,
      required: ['data'],
      properties: {
        data: { type: Type.STRING, description: 'Data no formato YYYY-MM-DD.' },
      },
    },
  },
];
