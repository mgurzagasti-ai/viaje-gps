# Fase 2 · API inicial

Esta fase deja una base funcional dentro de Next.js para conectar luego la app Expo.

## Estado actual

- autenticacion demo con token
- viajes y miembros reales en memoria
- almacenamiento de ubicaciones en memoria
- endpoints listos para conectar desde mobile

Importante:

- esta implementacion usa almacenamiento `en memoria`
- sirve para prototipo y desarrollo
- cuando pasemos a produccion, conviene mover todo a `Supabase` o `PostgreSQL`

## Endpoints

### `GET /api/auth/session`

Devuelve credenciales demo para probar el flujo.

### `POST /api/auth/session`

Body:

```json
{
  "userId": "usr_lucia",
  "tripCode": "JUJUY-2026"
}
```

Respuesta:

```json
{
  "token": "sess_xxxxxxxx",
  "user": {
    "id": "usr_lucia",
    "name": "Lucia Fernandez"
  },
  "trip": {
    "id": "trip_jujuy_001",
    "code": "JUJUY-2026"
  }
}
```

### `GET /api/trips`

Header:

```text
Authorization: Bearer TU_TOKEN
```

Lista los viajes disponibles para el usuario autenticado.

### `GET /api/trips/:tripId`

Header:

```text
Authorization: Bearer TU_TOKEN
```

Devuelve dashboard, miembros y resumen del viaje.

### `GET /api/trips/:tripId/members`

Devuelve integrantes con su ultima ubicacion y estado de conexion.

### `GET /api/trips/:tripId/locations`

Devuelve las ubicaciones mas recientes del viaje.

### `POST /api/trips/:tripId/locations`

Body:

```json
{
  "latitude": -24.1851,
  "longitude": -65.2994,
  "accuracy": 8,
  "speed": 34,
  "batteryLevel": 77,
  "signalStrength": "high"
}
```

## Siguiente integracion con Expo

Flujo recomendado:

1. crear sesion con `tripCode` + `userId`
2. guardar `token`
3. pedir permisos de ubicacion
4. enviar posicion cada 15 o 30 segundos a `POST /api/trips/:tripId/locations`
5. mostrar `ultima sincronizacion` y estado en la app
