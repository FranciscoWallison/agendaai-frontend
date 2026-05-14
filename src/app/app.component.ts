import { Component, OnInit } from '@angular/core';

import { environment } from '../environments/environment';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(private api: ApiService) {}

  async ngOnInit(): Promise<void> {
    console.log(`[HEALTH] API base: ${environment.apiUrl}`);
    try {
      const res = await this.api.healthCheck();
      console.log('[HEALTH] backend OK ->', res);
    } catch (err) {
      console.error('[HEALTH] backend FAIL ->', err);
    }
  }
}
