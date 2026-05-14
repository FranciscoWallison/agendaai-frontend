import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';

import { AuthService } from '../services/auth.service';

@Component({
  standalone: true,
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, IonicModule],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  loading = false;

  form = this.fb.group({
    nome: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telefone: [''],
    senha: [
      '',
      [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/(?=.*[a-zA-Z])(?=.*\d)/),
      ],
    ],
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
      await this.auth.register(this.form.value as any);
      this.router.navigateByUrl('/home', { replaceUrl: true });
    } catch (e: any) {
      const msg = Array.isArray(e?.error?.message)
        ? e.error.message.join(' | ')
        : e?.error?.message ?? 'Falha no cadastro';
      const t = await this.toast.create({
        message: msg,
        color: 'danger',
        duration: 3500,
      });
      await t.present();
    } finally {
      this.loading = false;
    }
  }
}
