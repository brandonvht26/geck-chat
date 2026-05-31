# 📜 RULES.MD — Reglas de Oro del Proyecto GeckChat

> ⚠️ **ESTE ARCHIVO SOLO PUEDE SER MODIFICADO CON AUTORIZACIÓN EXPLÍCITA DEL OWNER (Brandon).**
> Ningún modelo o agente puede editar, reescribir ni eliminar este archivo sin aprobación directa.

---

## 1. Identidad del Proyecto

- **Nombre:** GeckChat
- **Plataforma:** Mobile (Android primario, iOS secundario)
- **Descripción:** Aplicación de mensajería en tiempo real con soporte de chats privados, grupos (Workspaces), envío de archivos, notas de voz y personalización de UI.
- **Mascota:** Willy 🦎 (el gecko). Se usa en textos vacíos y mensajes amigables.

---

## 2. Stack Tecnológico Oficial

| Capa | Tecnología | Versión |
|---|---|---|
| Framework base | Expo (SDK 54) | `~54.0.34` |
| Lenguaje | TypeScript | `~5.9.2` |
| Runtime UI | React Native | `0.81.5` |
| React | React 19 | `19.1.0` |
| Routing | Expo Router | `~6.0.23` (file-based routing) |
| Estilos | NativeWind (Tailwind CSS) | `^4.2.3` + `tailwindcss ^3.3.2` |
| Animaciones | React Native Reanimated | `~4.1.1` |
| Gestos | React Native Gesture Handler | `~2.28.0` |
| Estado servidor | TanStack React Query | `^5.100.10` |
| Estado global | Zustand | `^5.0.13` |
| Formularios | React Hook Form | `^7.73.1` |
| Validación | Zod | `^4.4.3` |
| HTTP Client | Axios | `^1.15.1` |
| WebSockets | Socket.IO Client | `^4.8.3` |
| Toasts | Sonner Native | `^0.24.0` |
| Almacenamiento local | AsyncStorage | `2.2.0` |
| Audio | Expo Audio | `~1.1.1` |
| Imágenes | Expo Image | `~3.0.11` |
| File System | Expo File System | `~19.0.22` |
| Iconos | @expo/vector-icons (Feather + Ionicons) | `^15.0.3` |
| Área segura | React Native Safe Area Context | `~5.6.0` |
| Build | EAS (Expo Application Services) | CLI `>=19.1.0` |

---

## 3. Idioma del Proyecto

- **Código:** Inglés (nombres de variables, funciones, componentes, hooks, servicios, tipos)
- **UI/UX & Textos de Usuario:** **Español** (placeholders, labels, mensajes de error, mensajes vacíos, toasts, etc.)
- **Comentarios en código:** Español (cuando aplique — se prefiere español para comentarios inline)
- **Archivos `.context/`:** Español exclusivamente

---

## 4. Arquitectura de Carpetas

Ver `architecture.md` para detalle completo. Resumen:

```
app/            → Pantallas (Expo Router file-based)
src/
  components/   → UI dividida en: chat/, layout/, shared/, ui/
  context/      → React Contexts globales (Socket)
  hooks/        → Custom hooks (queries/ para TanStack Query)
  schemas/      → Validaciones Zod
  services/     → Lógica HTTP (Axios) y WebSocket
  types/        → Interfaces TypeScript
assets/         → Fuentes, imágenes, sonidos, wallpapers
.context/       → Sistema de contexto del proyecto (este directorio)
```

---

## 5. Convenciones de Código

### 5.1 Componentes
- **PascalCase** para nombres de componentes y archivos de pantallas: `ChatList.tsx`, `MessageBubble.tsx`
- Cada componente en su propio archivo
- Props siempre tipadas con `interface`

### 5.2 Hooks
- Prefijo `use`: `useAuth`, `useChatSocket`, `useChatMessages`
- Los hooks de TanStack Query viven en `src/hooks/queries/`

### 5.3 Servicios
- Sufijo `.service.ts`: `chat.service.ts`, `auth.service.ts`
- Toda lógica HTTP pasa por la instancia `api` (Axios) de `src/services/api.ts`
- Nunca hacer peticiones HTTP directas desde pantallas o componentes

### 5.4 Estilos
- **NativeWind (Tailwind)** es la única forma de aplicar estilos
- No usar `StyleSheet.create()` salvo casos excepcionales donde Tailwind no alcance
- Los colores personalizados están definidos en `tailwind.config.js` — no inventar colores ad-hoc
- Para `style={}` inline solo se usa cuando se requieren valores dinámicos calculados en JS (ej. `insets.top`, `Dimensions`)

### 5.5 Animaciones
- Toda animación usa **React Native Reanimated** (`useSharedValue`, `useAnimatedStyle`, `withSpring`, `withTiming`, etc.)
- El patrón estándar de botón es `AnimatedSquishBtn`: escala a `0.85`–`0.94` en `onPressIn` con `withSpring({ damping: 15 })`, regresa a `1` en `onPressOut`
- Para filas de lista se usa `AnimatedFadeRow`: opacidad de `1` → `0.5` en `onPressIn` con `withTiming({ duration: 100 })`

### 5.6 Formularios
- `React Hook Form` + `Zod` para validación en pantallas de auth
- Schemas viven en `src/schemas/`

### 5.7 Navegación
- **Expo Router** file-based. No usar `@react-navigation` directamente para navegar
- `router.push()` para navegar adelante, `router.replace()` para reemplazar (login → home, etc.)
- `router.back()` para regresar

### 5.8 Toasts / Notificaciones
- Única librería permitida: **Sonner Native** (`sonner-native`)
- Duración estándar: **1500ms** (1.5 segundos)
- Posición: `top-center`, offset: `50`
- Para operaciones async usar `toast.promise()`
- `toast.success()`, `toast.error()`, `toast.loading()` según caso

### 5.9 Manejo de Errores HTTP
- Los mensajes de error al usuario siempre se extraen con `getErrorMessage()` de `src/services/api.ts`
- El interceptor de Axios maneja el `401` automáticamente (cierra sesión y redirige a login)

---

## 6. Reglas de Negocio Importantes

- **Autenticación:** JWT guardado en AsyncStorage con clave `@geckchat_token`. Se renueva automáticamente vía interceptor.
- **Tema:** `light` | `dark` | `system`. Se persiste en las preferencias del usuario en el backend y se aplica con NativeWind `colorScheme`.
- **Socket:** La conexión Socket.IO se inicia en `signIn`/`signUp` y se cierra en `signOut`. El `SocketProvider` solo se monta cuando el usuario está autenticado.
- **Wallpapers:** Pueden ser `bundled:primary`, `bundled:secondary`, `bundled:tertiary` (assets locales .webp) o una URL de imagen subida al servidor.
- **Mensajes eliminados:** Se marcan con `isDeleted: true` y muestran "Mensaje eliminado" (nunca se borran del arreglo local).
- **Permisos Android:** `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` (para notas de voz).

---

## 7. Builds con EAS

| Perfil | Tipo | Distribución | URL API |
|---|---|---|---|
| `development` | Dev Client | Internal | localhost:3000 |
| `preview` | APK | Internal | `https://geck-core.onrender.com` |
| `production` | AAB | Store | Variable de entorno remota |

- `appVersionSource: "remote"` — la versión la controla EAS, no el `app.json`
- `autoIncrement: true` solo en producción
- Para generar APK de prueba: `eas build --profile preview --platform android`

---

## 8. Variables de Entorno

| Variable | Uso |
|---|---|
| `EXPO_PUBLIC_API_URI` | URL base de la API REST y WebSocket |

El archivo `.env` no se commitea. Ver `.env.example` para referencia.

---

## 9. Sistema `.context/` — Guía de los Archivos

Esta sección describe el propósito, ciclo de vida y permisos de cada archivo dentro de `.context/`.

| Archivo | Propósito | Puede modificarse | Puede eliminarse |
|---|---|---|---|
| `rules.md` | Reglas de oro del proyecto: stack, convenciones, idioma, builds | ✅ Solo con autorización del owner | ❌ Nunca |
| `architecture.md` | Describe la arquitectura real del proyecto: flujos, capas, patrones | ❌ No se modifica | ❌ Nunca |
| `roadmap.md` | Plan de trabajo por jornada o sprint | ✅ Solo con autorización del owner | ❌ Nunca |
| `session.md` | Resumen volátil de la jornada actual. Se reescribe cada sesión | ✅ Se reescribe con cada sesión (con autorización) | ❌ Nunca |
| `skills/ui/SKILL.md` | Conocimiento específico de UI/UX: paleta, fuentes, animaciones, inputs, alertas | ✅ Solo con autorización del owner | ❌ Nunca |

### 9.1 Cuándo Actualizar / Archivar

- **`rules.md`:** Solo cuando cambie el stack tecnológico, se adopte una nueva convención, o cambie alguna regla de negocio fundamental.
- **`architecture.md`:** Este archivo es inmutable. Si la arquitectura cambia significativamente, el owner debe dar autorización para crear una nueva versión.
- **`roadmap.md`:** Se llena y actualiza al inicio de un sprint o jornada planificada, con autorización del owner.
- **`session.md`:** Se reescribe completamente al inicio de cada jornada de trabajo.
- **`skills/*.md`:** Se actualiza cuando se establece un nuevo patrón de UI/UX, se agrega una dependencia visual nueva, o se define una animación estándar nueva.

---

## 10. Directriz para Modelos de IA

> 🤖 **Si eres un modelo de IA trabajando en este proyecto, sigue estas reglas adicionales:**

1. **Lee siempre** `architecture.md` antes de proponer cambios estructurales.
2. **Consulta** `skills/ui/SKILL.md` antes de implementar cualquier componente visual.
3. **No inventes** colores, fuentes ni animaciones que no estén documentadas.
4. **No reestructures** carpetas ni flujos sin autorización explícita del owner.
5. **Sugiere actualizar un SKILL.md** cuando implementes un patrón nuevo de UI/UX que no esté documentado.
6. **Sugiere actualizar `session.md`** al finalizar cada bloque de trabajo significativo.
7. **Sugiere actualizar `roadmap.md`** cuando se complete un milestone o cuando el plan cambie significativamente.
8. **Nunca elimines** ningún archivo de `.context/`.
9. **Informa al owner** cuando detectes inconsistencias entre el código y la documentación aquí registrada.
10. **El idioma de UI es español.** Todo texto visible al usuario debe estar en español.
