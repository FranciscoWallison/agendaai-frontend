import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { ApiService } from '../services/api.service';
import {
  Paciente,
  Profissional,
  Servico,
  SlotLivre,
} from '../models/api.models';

@Component({
  standalone: true,
  selector: 'app-agendar',
  imports: [CommonModule, FormsModule, IonicModule],
  templateUrl: './agendar.page.html',
})
export class AgendarPage implements OnInit {
  pacientes: Paciente[] = [];
  profissionais: Profissional[] = [];
  servicos: Servico[] = [];
  slots: SlotLivre[] = [];

  pacienteId = '';
  profissionalId = '';
  servicoId = '';
  data = '';
  slotSelecionado: SlotLivre | null = null;

  loadingSlots = false;
  salvando = false;

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('pacienteId');
    if (id) this.pacienteId = id;

    const hoje = new Date();
    hoje.setDate(hoje.getDate() + 1);
    this.data = hoje.toISOString().slice(0, 10);

    [this.pacientes, this.profissionais, this.servicos] = await Promise.all([
      this.api.listarPacientes(),
      this.api.listarProfissionais(),
      this.api.listarServicos(),
    ]);
  }

  async carregarSlots() {
    this.slots = [];
    this.slotSelecionado = null;
    if (!this.profissionalId || !this.servicoId || !this.data) return;
    this.loadingSlots = true;
    try {
      this.slots = await this.api.listarSlots(
        this.profissionalId,
        this.data,
        this.servicoId,
      );
    } catch (e: any) {
      const t = await this.toast.create({
        message: e?.error?.message ?? 'Erro ao buscar horarios',
        color: 'danger',
        duration: 2500,
      });
      await t.present();
    } finally {
      this.loadingSlots = false;
    }
  }

  async confirmar() {
    if (!this.slotSelecionado) return;
    this.salvando = true;
    try {
      await this.api.criarAgendamento({
        pacienteId: this.pacienteId,
        profissionalId: this.profissionalId,
        servicoId: this.servicoId,
        dataHoraInicio: this.slotSelecionado.inicio,
      });
      const t = await this.toast.create({
        message: 'Agendamento criado!',
        color: 'success',
        duration: 2000,
      });
      await t.present();
      this.router.navigateByUrl('/meus-agendamentos', { replaceUrl: true });
    } catch (e: any) {
      const t = await this.toast.create({
        message: e?.error?.message ?? 'Erro ao agendar',
        color: 'danger',
        duration: 2500,
      });
      await t.present();
    } finally {
      this.salvando = false;
    }
  }

  formatHora(iso: string) {
    return new Date(iso).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
