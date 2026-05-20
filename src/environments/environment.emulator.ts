// Android emulator: 10.0.2.2 e o alias do host visto de dentro do emulador.
// Backend deve estar rodando no host (via Docker Desktop) na porta 3000.
// Em device fisico via USB, prefira `adb reverse tcp:3000 tcp:3000` + environment.ts (localhost).
export const environment = {
  production: false,
  apiUrl: 'http://10.0.2.2:3000',
};
