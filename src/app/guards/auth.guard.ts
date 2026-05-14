import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.init();
  const ok = await auth.isAuthenticated();
  if (!ok) {
    router.navigateByUrl('/login', { replaceUrl: true });
    return false;
  }
  return true;
};
