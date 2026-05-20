import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';

import { GeminiService } from '../services/gemini.service';

@Component({
  standalone: true,
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './settings.page.html',
})
export class SettingsPage implements OnInit {
  apiKey = '';
  jaSalvou = false;
  testando = false;

  constructor(
    private gemini: GeminiService,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    const k = await this.gemini.getApiKey();
    if (k) {
      // Mostra mascarada pra evitar copiar sem querer
      this.apiKey = k;
      this.jaSalvou = true;
    }
  }

  async salvar() {
    if (!this.apiKey.trim()) {
      await this.show('Cole a API key antes de salvar', 'warning');
      return;
    }
    await this.gemini.setApiKey(this.apiKey);
    this.jaSalvou = true;
    await this.show('Chave salva', 'success');
  }

  async testar() {
    if (!this.apiKey.trim()) {
      await this.show('Cole a API key primeiro', 'warning');
      return;
    }
    await this.gemini.setApiKey(this.apiKey);
    this.testando = true;
    try {
      const r = await this.gemini.testarConexao();
      if (r.ok) {
        await this.show('IA conectada com sucesso', 'success');
      } else {
        await this.show(`Falha: ${r.erro}`, 'danger', 4000);
      }
    } finally {
      this.testando = false;
    }
  }

  async limpar() {
    await this.gemini.clearApiKey();
    this.apiKey = '';
    this.jaSalvou = false;
    await this.show('Chave removida', 'medium');
  }

  private async show(message: string, color: string, duration = 2500) {
    const t = await this.toast.create({ message, color, duration });
    await t.present();
  }
}
