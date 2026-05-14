import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';

import { ApiService } from '../services/api.service';
import { Agendamento } from '../models/api.models';

@Component({
  standalone: true,
  selector: 'app-meus-agendamentos',
  imports: [CommonModule, IonicModule],
  templateUrl: './meus-agendamentos.page.html',
})
export class MeusAgendamentosPage implements OnInit {
  agendamentos: Agendamento[] = [];
  loading = false;

  constructor(
    private api: ApiService,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    await this.refresh();
  }

  async refresh(ev?: Event) {
    this.loading = true;
    try {
      this.agendamentos = await this.api.listarAgendamentos();
    } catch {
      const t = await this.toast.create({
        message: 'Erro ao carregar agendamentos',
        color: 'danger',
        duration: 2500,
      });
      await t.present();
    } finally {
      this.loading = false;
      (ev?.target as any)?.complete?.();
    }
  }

  async cancelar(a: Agendamento) {
    if (a.status === 'CANCELADO') return;
    const al = await this.alert.create({
      header: 'Cancelar agendamento?',
      message: `${a.paciente?.nome} com ${a.profissional?.nome} em ${this.format(a.dataHoraInicio)}`,
      buttons: [
        { text: 'Voltar', role: 'cancel' },
        {
          text: 'Cancelar agendamento',
          role: 'destructive',
          handler: async () => {
            await this.api.cancelarAgendamento(a.id);
            await this.refresh();
          },
        },
      ],
    });
    await al.present();
  }

  format(iso: string) {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  statusColor(s: string) {
    return s === 'AGENDADO' ? 'success' : s === 'CANCELADO' ? 'medium' : 'primary';
  }
}
