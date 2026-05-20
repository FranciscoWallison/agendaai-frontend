// Browser dev (ng serve). Backend e banco sobem via Docker Desktop em localhost:3000.
// Para emulador Android, use `--configuration emulator` (-> environment.emulator.ts).
// Para producao, use `--configuration production` (-> environment.prod.ts).
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',
};
