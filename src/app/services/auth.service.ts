import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { BehaviorSubject } from 'rxjs';

import { environment } from '../../environments/environment';
import { LoginResponse, Responsavel } from '../models/api.models';
import { StorageService } from './storage.service';

const KEY_TOKEN = 'agendaai.token';
const KEY_USER = 'agendaai.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly base = environment.apiUrl;

  user$ = new BehaviorSubject<Responsavel | null>(null);

  constructor(
    private http: HttpClient,
    private storage: StorageService,
  ) {}

  async init() {
    const user = await this.storage.get<Responsavel>(KEY_USER);
    if (user) this.user$.next(user);
  }

  async register(data: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
  }) {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.base}/auth/register`, data),
    );
    await this.persist(res);
    return res;
  }

  async login(email: string, senha: string) {
    const res = await firstValueFrom(
      this.http.post<LoginResponse>(`${this.base}/auth/login`, { email, senha }),
    );
    await this.persist(res);
    return res;
  }

  async logout() {
    await this.storage.remove(KEY_TOKEN);
    await this.storage.remove(KEY_USER);
    this.user$.next(null);
  }

  async getToken(): Promise<string | null> {
    return this.storage.get<string>(KEY_TOKEN);
  }

  async isAuthenticated() {
    return !!(await this.getToken());
  }

  private async persist(res: LoginResponse) {
    await this.storage.set(KEY_TOKEN, res.accessToken);
    const u: Responsavel = { ...res.responsavel };
    await this.storage.set(KEY_USER, u);
    this.user$.next(u);
  }
}
