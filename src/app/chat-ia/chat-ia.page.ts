import {
  AfterViewChecked,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { GeminiService } from '../services/gemini.service';
import { ChatMessage } from '../models/chat.models';

@Component({
  standalone: true,
  selector: 'app-chat-ia',
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './chat-ia.page.html',
  styleUrls: ['./chat-ia.page.scss'],
})
export class ChatIaPage implements OnInit, AfterViewChecked {
  @ViewChild('scrollContent') scrollContent?: ElementRef<HTMLDivElement>;

  texto = '';
  mensagens: ChatMessage[] = [];
  enviando = false;

  sugestoes = [
    'Liste meus pacientes',
    'Quais sao os pediatras?',
    'Quais sao meus proximos agendamentos?',
    'Marca uma consulta de rotina pro Joaozinho amanha as 10h',
  ];

  constructor(
    private gemini: GeminiService,
    private toast: ToastController,
    private router: Router,
  ) {}

  async ngOnInit() {
    if (!(await this.gemini.hasApiKey())) {
      const t = await this.toast.create({
        message: 'Configure sua API key do Gemini primeiro',
        color: 'warning',
        duration: 3000,
      });
      await t.present();
      this.router.navigateByUrl('/settings');
    } else {
      this.mensagens.push({
        role: 'model',
        text:
          'Oi! Sou o assistente do agendaAI. Posso listar pacientes, marcar e cancelar consultas. Como posso ajudar?',
      });
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  async enviar() {
    const t = this.texto.trim();
    if (!t || this.enviando) return;
    this.texto = '';
    this.enviando = true;
    try {
      await this.gemini.enviarMensagem(t, (m) => {
        // O proprio service ja emite a msg do user no inicio, entao
        // aqui so colamos no array.
        if (m.loading && m.role === 'tool') {
          this.mensagens.push(m);
          return;
        }
        // Substitui a ultima msg "loading" do mesmo tool, se houver
        if (m.role === 'tool' && !m.loading) {
          const idx = this.mensagens.findIndex(
            (x) => x.loading && x.toolName === m.toolName,
          );
          if (idx >= 0) this.mensagens[idx] = m;
          else this.mensagens.push(m);
          return;
        }
        this.mensagens.push(m);
      });
    } catch (e: any) {
      this.mensagens = this.mensagens.filter((m) => !(m.role === 'tool' && m.loading));
      const tt = await this.toast.create({
        message: this.mensagemAmigavelErro(e),
        color: 'warning',
        duration: 3500,
      });
      await tt.present();
    } finally {
      this.enviando = false;
    }
  }

  private mensagemAmigavelErro(e: any): string {
    const code = e?.error?.code ?? e?.status ?? e?.code;
    const status = e?.error?.status;
    if (code === 503 || status === 'UNAVAILABLE') {
      return 'Servico do Gemini sobrecarregado. Tente de novo em instantes.';
    }
    if (code === 429 || status === 'RESOURCE_EXHAUSTED') {
      return 'Limite de uso do Gemini atingido. Aguarde um momento.';
    }
    if (code === 401 || code === 403) {
      return 'API key do Gemini invalida. Verifique em Settings.';
    }
    return e?.message ?? 'Falha ao falar com o assistente.';
  }

  usarSugestao(s: string) {
    this.texto = s;
  }

  resetar() {
    this.gemini.resetHistory();
    this.mensagens = [
      {
        role: 'model',
        text: 'Conversa zerada. Posso ajudar com o que?',
      },
    ];
  }

  private scrollToBottom() {
    const el = this.scrollContent?.nativeElement;
    if (el) el.scrollTop = el.scrollHeight;
  }
}
