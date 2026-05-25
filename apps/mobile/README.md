# Cliente movil · Expo React Native

La fase 3 deja una base inicial de app Expo conectada al backend demo del monitor.

## Incluye

- pantalla de acceso con `tripCode` y usuarios demo
- configuracion editable de `API base URL`
- creacion de sesion contra `POST /api/auth/session`
- lectura del dashboard del viaje
- envio de ubicacion actual con `expo-location`
- UI moderna con `NativeWind`

## Estructura

- `App.tsx`: entrada principal
- `src/MobileClientApp.tsx`: flujo principal de la app
- `src/api.ts`: cliente HTTP para Next.js
- `src/location.ts`: lectura de GPS actual
- `src/types.ts`: contratos usados por la app

## Como ejecutarla

1. instalar dependencias:

```bash
cd apps/mobile
npm install
```

2. arrancar Expo:

```bash
npm run start
```

3. en telefono real:

- asegurate de que el monitor Next.js corra en la misma red Wi-Fi
- cambiá la URL inicial por la IP local de tu PC
- ejemplo: `http://192.168.0.10:3000`

## Importante

Esta fase todavia usa:

- autenticacion demo
- almacenamiento en memoria del lado Next.js
- ubicacion en primer plano

## Proxima mejora recomendada

- tracking en background con `expo-task-manager`
- almacenamiento persistente con `Supabase`
- login real por usuario
- historial de recorrido y alertas push

## APK privada con EAS Build

1. iniciar sesion en Expo:

```bash
npx eas-cli login
```

2. generar la APK interna desde `apps/mobile`:

```bash
npx eas-cli build --platform android --profile preview
```

3. cuando termine, Expo entrega una URL para descargar e instalar la APK.

Perfiles configurados en `eas.json`:

- `preview`: APK privada instalable
- `production`: AAB para Play Store
