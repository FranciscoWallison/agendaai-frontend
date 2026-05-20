export type ChatRole = 'user' | 'model' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  text: string;
  // Quando role === 'tool': qual funcao foi executada
  toolName?: string;
  // Indicador visual de "em progresso"
  loading?: boolean;
}
