# VIAJE GPS - Prompt Maestro para Codex / Agente IA

## Objetivo General

Rediseñar completamente la experiencia móvil de la aplicación
`apps/mobile` manteniendo intactos:

-   Backend
-   API
-   GPS
-   Base de datos
-   Comunicación en tiempo real
-   Monitor web en Next.js
-   Lógica de viajes y seguimiento

El objetivo es que la aplicación deje de sentirse como una página web
responsive y pase a sentirse como una aplicación nativa moderna similar
a:

-   Mercado Pago
-   Uber
-   Cabify
-   Google Maps

------------------------------------------------------------------------

# Diagnóstico actual

La aplicación móvil ya está correctamente construida sobre:

-   Expo
-   React Native
-   react-native-maps
-   expo-location
-   expo-task-manager

Sin embargo, la interfaz actual se encuentra basada principalmente en
pantallas largas con ScrollView y navegación vertical.

Esto genera la sensación de estar navegando una página web.

El problema es principalmente de UX/UI y no de arquitectura.

Distribución estimada del problema:

-   90% diseño y navegación
-   10% arquitectura

------------------------------------------------------------------------

# Cambios requeridos

## 1 - Eliminar el enfoque de pantalla única

Buscar y reducir al mínimo estructuras similares a:

``` tsx
<ScrollView>
 ...
</ScrollView>
```

Separar funcionalidades en pantallas independientes.

------------------------------------------------------------------------

## 2 - Implementar navegación inferior fija

Instalar si no existen:

``` bash
npm install @react-navigation/native
npm install @react-navigation/bottom-tabs
npm install react-native-screens
npm install react-native-safe-area-context
```

Implementar:

``` tsx
<Tab.Navigator>
  <Tab.Screen name="Mapa" component={MapScreen} />
  <Tab.Screen name="Unidades" component={UnitsScreen} />
  <Tab.Screen name="Alertas" component={AlertsScreen} />
  <Tab.Screen name="Reportes" component={ReportsScreen} />
  <Tab.Screen name="Perfil" component={ProfileScreen} />
</Tab.Navigator>
```

------------------------------------------------------------------------

## 3 - Crear las siguientes pantallas

-   MapScreen.tsx
-   UnitsScreen.tsx
-   AlertsScreen.tsx
-   ReportsScreen.tsx
-   ProfileScreen.tsx

------------------------------------------------------------------------

## 4 - Pantalla principal

El mapa debe ocupar casi toda la pantalla.

Diseño esperado:

``` text
┌───────────────────────┐
│                       │
│                       │
│         MAPA          │
│                       │
│                       │
├───────────────────────┤
│ Unidad 105            │
│ 42 km/h               │
│ En servicio           │
│ Última actualización  │
└───────────────────────┘
```

------------------------------------------------------------------------

## 5 - Barra inferior permanente

Diseño esperado:

``` text
┌───────────────────────┐
│                       │
│         MAPA          │
│                       │
├───────────────────────┤
│ 🗺️ 🚌 🔔 📊 ⚙️ │
└───────────────────────┘
```

Iconos sugeridos:

-   🗺️ mapa
-   🚌 unidades
-   🔔 alertas
-   📊 reportes
-   ⚙️ perfil

------------------------------------------------------------------------

## 6 - Utilizar tarjetas modernas

Ejemplo:

``` text
┌──────────────────────┐
│ Unidad 105           │
│ 🟢 En línea          │
│ 42 km/h              │
│ Ruta 42              │
└──────────────────────┘
```

------------------------------------------------------------------------

## 7 - Mantener WebView únicamente para el mapa

Se detectó el uso de:

``` tsx
react-native-webview
```

Permitir únicamente:

-   fallback Android para mapas
-   compatibilidad específica

No utilizar WebView para renderizar la aplicación completa.

------------------------------------------------------------------------

## 8 - Arquitectura objetivo

``` text
apps/mobile/
│
├── screens/
│   ├── MapScreen.tsx
│   ├── UnitsScreen.tsx
│   ├── AlertsScreen.tsx
│   ├── ReportsScreen.tsx
│   └── ProfileScreen.tsx
│
├── navigation/
│
├── components/
│
├── hooks/
│
├── services/
│
└── App.tsx
```

------------------------------------------------------------------------

# Referencia visual objetivo

La aplicación debe transmitir:

-   rapidez
-   simplicidad
-   pocos clics
-   mínima cantidad de scroll
-   navegación intuitiva
-   apariencia profesional

Inspirarse visualmente en:

-   Mercado Pago
-   Uber Driver
-   Cabify Driver
-   Google Maps

Características visuales deseadas:

-   modo oscuro
-   tarjetas flotantes
-   animaciones suaves
-   botones grandes
-   tipografía clara
-   bordes redondeados
-   mapa predominante
-   colores modernos

------------------------------------------------------------------------

# Prioridad de implementación

1.  Navegación inferior
2.  Separar pantallas
3.  Mapa full screen
4.  Tarjetas visuales
5.  Mejoras visuales y animaciones

------------------------------------------------------------------------

# Resultado esperado

La aplicación debe sentirse como una app móvil nativa moderna y no como
una página web adaptada al teléfono.

Mantener toda la lógica actual y enfocarse exclusivamente en la
experiencia de usuario y presentación visual.
