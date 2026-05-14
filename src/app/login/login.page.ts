import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './login.page.html',
})
export class LoginPage {
  loading = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
  });

  constructor(
    private fb: FormBuilder,
    private auth: AuthService,
    private router: Router,
    private toast: ToastController,
  ) {}

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    try {
      const { email, senha } = this.form.value;
      await this.auth.login(email!, senha!);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (e: any) {
      const t = await this.toast.create({
        message: e?.error?.message ?? 'Falha ao entrar',
        color: 'danger',
        duration: 2500,
      });
      await t.present();
    } finally {
      this.loading = false;
    }
  }
}
