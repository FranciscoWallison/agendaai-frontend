import { TestBed } from '@angular/core/testing';
import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';

import { AuthService } from './auth.service';
import { StorageService } from './storage.service';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let storage: jasmine.SpyObj<StorageService>;

  beforeEach(() => {
    storage = jasmine.createSpyObj<StorageService>('StorageService', [
      'set',
      'get',
      'remove',
      'clear',
      'init',
    ]);
    storage.set.and.resolveTo(undefined);
    storage.get.and.resolveTo(null);
    storage.remove.and.resolveTo(undefined);
    storage.clear.and.resolveTo(undefined);
    storage.init.and.resolveTo(undefined);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: StorageService, useValue: storage },
      ],
    });

    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login salva token e emite user$', async () => {
    const promise = service.login('demo@x.com', 'senha123');

    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'demo@x.com', senha: 'senha123' });

    req.flush({
      accessToken: 'tok-123',
      responsavel: { id: 'r-1', nome: 'Demo', email: 'demo@x.com' },
    });

    await promise;
    expect(storage.set).toHaveBeenCalledWith('agendaai.token', 'tok-123');
    expect(service.user$.value?.email).toBe('demo@x.com');
  });

  it('logout limpa storage e user$', async () => {
    await service.logout();
    expect(storage.remove).toHaveBeenCalledWith('agendaai.token');
    expect(storage.remove).toHaveBeenCalledWith('agendaai.user');
    expect(service.user$.value).toBeNull();
  });

  it('isAuthenticated true quando ha token', async () => {
    storage.get.and.resolveTo('tok-existente');
    expect(await service.isAuthenticated()).toBe(true);
  });

  it('isAuthenticated false sem token', async () => {
    storage.get.and.resolveTo(null);
    expect(await service.isAuthenticated()).toBe(false);
  });
});
