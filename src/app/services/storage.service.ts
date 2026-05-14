import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private _storage: Storage | null = null;
  private initPromise: Promise<void> | null = null;

  constructor(private storage: Storage) {}

  async init() {
    if (this._storage) return;
    if (!this.initPromise) {
      this.initPromise = this.storage.create().then((s) => {
        this._storage = s;
      });
    }
    await this.initPromise;
  }

  async set(key: string, value: unknown) {
    await this.init();
    await this._storage!.set(key, value);
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    await this.init();
    return (await this._storage!.get(key)) as T | null;
  }

  async remove(key: string) {
    await this.init();
    await this._storage!.remove(key);
  }

  async clear() {
    await this.init();
    await this._storage!.clear();
  }
}
