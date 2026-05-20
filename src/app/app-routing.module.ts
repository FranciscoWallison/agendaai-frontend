import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'agendar/:pacienteId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./agendar/agendar.page').then((m) => m.AgendarPage),
  },
  {
    path: 'meus-agendamentos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./meus-agendamentos/meus-agendamentos.page').then(
        (m) => m.MeusAgendamentosPage,
      ),
  },
  {
    path: 'chat-ia',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./chat-ia/chat-ia.page').then((m) => m.ChatIaPage),
  },
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./settings/settings.page').then((m) => m.SettingsPage),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
