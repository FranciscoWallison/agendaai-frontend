import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  Agendamento,
  Paciente,
  Profissional,
  Servico,
  SlotLivre,
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ---- health-check ----
  healthCheck() {
    return firstValueFrom(this.http.get(`${this.base}/health`));
  }

  // ---- pacientes ----
  listarPacientes() {
    return firstValueFrom(this.http.get<Paciente[]>(`${this.base}/pacientes`));
  }

  criarPaciente(dto: {
    nome: string;
    dataNascimento: string;
    sexo?: 'M' | 'F' | 'O';
    observacoes?: string;
  }) {
    return firstValueFrom(
      this.http.post<Paciente>(`${this.base}/pacientes`, dto),
    );
  }

  removerPaciente(id: string) {
    return firstValueFrom(
      this.http.delete<{ ok: boolean }>(`${this.base}/pacientes/${id}`),
    );
  }

  // ---- profissionais / servicos / slots ----
  listarProfissionais() {
    return firstValueFrom(
      this.http.get<Profissional[]>(`${this.base}/profissionais`),
    );
  }

  listarServicos() {
    return firstValueFrom(this.http.get<Servico[]>(`${this.base}/servicos`));
  }

  listarSlots(profissionalId: string, data: string, servicoId: string) {
    const params = new HttpParams().set('data', data).set('servicoId', servicoId);
    return firstValueFrom(
      this.http.get<SlotLivre[]>(
        `${this.base}/profissionais/${profissionalId}/slots`,
        { params },
      ),
    );
  }

  // ---- agendamentos ----
  listarAgendamentos() {
    return firstValueFrom(
      this.http.get<Agendamento[]>(`${this.base}/agendamentos`),
    );
  }

  criarAgendamento(dto: {
    pacienteId: string;
    profissionalId: string;
    servicoId: string;
    dataHoraInicio: string;
    observacoes?: string;
  }) {
    return firstValueFrom(
      this.http.post<Agendamento>(`${this.base}/agendamentos`, dto),
    );
  }

  cancelarAgendamento(id: string) {
    return firstValueFrom(
      this.http.delete<Agendamento>(`${this.base}/agendamentos/${id}`),
    );
  }
}
