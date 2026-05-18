# Viaje GPS · Arquitectura inicial

## Objetivo

Construir una solucion para seguir en tiempo real la ubicacion de cada integrante de un viaje.

- `Monitor web`: Next.js
- `Cliente movil`: Expo React Native + NativeWind
- `Backend`: API y logica inicial en Next.js o BFF
- `Base de datos y realtime`: Supabase

## Componentes

### 1. Monitor web

Responsabilidades:

- mostrar mapa con viajeros activos
- ver ultima ubicacion reportada
- detectar viajeros sin actualizacion reciente
- mostrar alertas simples de bateria, perdida de senal o desvio

Pantallas sugeridas:

- dashboard general
- mapa del viaje
- detalle de cada viajero
- panel de alertas

### 2. Cliente movil

Responsabilidades:

- iniciar sesion o unirse a un viaje
- solicitar permisos de ubicacion
- obtener GPS en foreground y background
- enviar latitud, longitud, precision y timestamp
- permitir pausar o reanudar el seguimiento

Pantallas sugeridas:

- bienvenida / acceso
- estado del seguimiento
- resumen del viaje
- permisos y configuracion

### 3. Backend

Responsabilidades:

- autenticar usuarios
- registrar viajes
- relacionar integrantes con viajes
- recibir ubicaciones
- publicar cambios en tiempo real al monitor

## Modelo de datos minimo

### users

- `id`
- `name`
- `phone`
- `role`

### trips

- `id`
- `name`
- `status`
- `starts_at`

### trip_members

- `id`
- `trip_id`
- `user_id`
- `member_role`

### locations

- `id`
- `trip_id`
- `user_id`
- `latitude`
- `longitude`
- `accuracy`
- `speed`
- `battery_level`
- `recorded_at`

## Flujo de ubicacion

1. El usuario abre la app movil.
2. La app solicita permisos de ubicacion.
3. La app obtiene la posicion actual.
4. La app envia la posicion al backend.
5. El backend guarda la ubicacion en la base.
6. El monitor web recibe la actualizacion y refresca el panel.

## Recomendaciones practicas

- usar `Expo` para acelerar el cliente movil
- usar `NativeWind` en mobile en lugar de Bootstrap
- usar `Tailwind CSS` en Next.js
- enviar ubicacion cada `15 a 30 segundos` o por cambio de distancia
- considerar modo ahorro de bateria
- guardar `ultima ubicacion conocida` si el usuario pierde senal

## Fases sugeridas

### Fase 1

- monitor web con datos mock
- app movil con UI base
- contrato de API

### Fase 2

- autenticacion
- viajes reales
- almacenamiento de ubicaciones

### Fase 3

- realtime
- alertas
- historial de recorrido

### Fase 4

- geocercas
- bateria y conectividad
- notificaciones push
