// Dev: emulador Android usa 10.0.2.2 para falar com o host.
// Em device fisico via USB, rode `adb reverse tcp:3000 tcp:3000` e use 'http://localhost:3000'.
export const environment = {
  production: false,
  apiUrl: 'http://10.0.2.2:3000',
};
