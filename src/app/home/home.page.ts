import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';

import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { Paciente, Responsavel } from '../models/api.models';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, FormsModule, IonicModule, RouterModule],
  templateUrl: './home.page.html',
})
export class HomePage implements OnInit {
  user: Responsavel | null = null;
  pacientes: Paciente[] = [];
  loading = false;

  constructor(
    private api: ApiService,
    private auth: AuthService,
    private router: Router,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

  async ngOnInit() {
    this.auth.user$.subscribe((u) => (this.user = u));
    await this.refresh();
  }

  async refresh(ev?: Event) {
    this.loading = true;
    try {
      this.pacientes = await this.api.listarPacientes();
    } catch {
      const t = await this.toast.create({
        message: 'Erro ao carregar pacientes',
        color: 'danger',
        duration: 2500,
      });
      await t.present();
    } finally {
      this.loading = false;
      (ev?.target as any)?.complete?.();
    }
  }

  async novoPaciente() {
    const a = await this.alert.create({
      header: 'Novo paciente',
      inputs: [
        { name: 'nome', type: 'text', placeholder: 'Nome' },
        { name: 'dataNascimento', type: 'date', placeholder: 'Nascimento' },
        { name: 'sexo', type: 'text', placeholder: 'Sexo (M, F ou O)' },
      ],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Criar',
          handler: async (v) => {
            try {
              await this.api.criarPaciente({
                nome: v.nome,
                dataNascimento: v.dataNascimento,
                sexo: (v.sexo || 'O').toUpperCase() as 'M' | 'F' | 'O',
              });
              await this.refresh();
            } catch (e: any) {
              const t = await this.toast.create({
                message: e?.error?.message ?? 'Falha ao criar paciente',
                color: 'danger',
                duration: 2500,
              });
              await t.present();
            }
          },
        },
      ],
    });
    await a.present();
  }

  async remover(p: Paciente) {
    const a = await this.alert.create({
      header: `Remover ${p.nome}?`,
      message: 'Os agendamentos do paciente sao mantidos no historico.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Remover',
          role: 'destructive',
          handler: async () => {
            await this.api.removerPaciente(p.id);
            await this.refresh();
          },
        },
      ],
    });
    await a.present();
  }

  agendar(p: Paciente) {
    this.router.navigate(['/agendar', p.id]);
  }

  async logout() {
    await this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
