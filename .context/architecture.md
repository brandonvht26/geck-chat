# 🏗️ ARCHITECTURE.MD — Arquitectura del Proyecto GeckChat

> ❌ **ESTE ARCHIVO ES INMUTABLE. No puede ser modificado ni eliminado sin autorización explícita del owner (Brandon).**
> Su propósito es servir como fuente de verdad para cualquier modelo o desarrollador que trabaje en el proyecto.
> Si algo aquí no coincide con el código actual, reportarlo al owner — NO cambiar el código para que "coincida con una idea nueva".

---

## 1. Visión General

GeckChat es una aplicación móvil de mensajería en tiempo real construida sobre **Expo SDK 54** con **React Native 0.81.5**. La app conecta con un backend REST + WebSocket alojado en `https://geck-core.onrender.com`.

La arquitectura sigue un modelo **cliente-servidor desacoplado**:
- **Frontend (este repo):** React Native + Expo Router
- **Backend:** API externa (Node.js/Express — no está en este repositorio)
- **Comunicación REST:** Axios con interceptores de autenticación JWT
- **Comunicación en tiempo real:** Socket.IO Client

---

## 2. Estructura de Directorios

```
geck-chat/
├── app/                    ← PANTALLAS (Expo Router file-based routing)
│   ├── _layout.tsx         ← Root Layout: providers globales
│   ├── index.tsx           ← Splash/Guard screen (verifica token → home | welcome)
│   ├── welcome.tsx         ← Pantalla de bienvenida (no autenticado)
│   ├── home.tsx            ← Pantalla principal (lista de chats)
│   ├── search.tsx          ← Búsqueda global de usuarios
│   ├── auth/               ← Flujo de autenticación
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── chat/               ← Chat individual
│   │   ├── [id].tsx        ← Pantalla de chat (privado o grupo)
│   │   └── message-info.tsx← Detalle de lectura de mensaje en grupos
│   ├── workspace/          ← Workspaces (grupos colaborativos)
│   │   ├── [id].tsx        ← Pantalla de workspace
│   │   ├── create.tsx      ← Crear workspace
│   │   └── invite.tsx      ← Invitar miembros
│   ├── profile/            ← Perfil de usuario
│   │   ├── index.tsx       ← Vista principal del perfil
│   │   ├── edit.tsx        ← Editar nombre/email
│   │   ├── change-password.tsx
│   │   └── personalization.tsx ← Tema y wallpaper
│   ├── user/               ← Perfil de otro usuario
│   │   └── [id].tsx
│   └── documents/          ← Documentos/archivos
│       └── index.tsx
│
├── src/                    ← LÓGICA DE NEGOCIO Y COMPONENTES
│   ├── components/
│   │   ├── chat/           ← Componentes de chat
│   │   │   ├── ChatList.tsx       ← Lista de conversaciones (home)
│   │   │   ├── ChatInput.tsx      ← Input de mensaje + botones acción
│   │   │   ├── MessageBubble.tsx  ← Burbuja de mensaje individual
│   │   │   └── AudioPlayer.tsx    ← Reproductor de nota de voz
│   │   ├── layout/         ← Componentes de layout global
│   │   │   ├── MainHeader.tsx     ← Header principal de la app
│   │   │   └── SideMenu.tsx       ← Menú lateral deslizante
│   │   ├── shared/         ← Componentes compartidos entre módulos
│   │   │   └── UserSearch.tsx     ← Buscador de usuarios
│   │   └── ui/             ← Componentes UI genéricos reutilizables
│   │       ├── Placeholder.tsx
│   │       └── UserAvatar.tsx
│   │
│   ├── context/            ← React Contexts globales
│   │   └── SocketContext.tsx ← Provee `socket` y `onlineUsers` a toda la app
│   │
│   ├── hooks/              ← Custom hooks
│   │   ├── useAuth.tsx     ← AuthProvider + useAuth (autenticación global)
│   │   ├── useChatSocket.ts← Suscripción a eventos Socket para una sala de chat
│   │   └── queries/        ← Hooks de TanStack React Query
│   │       ├── useChatMessages.ts ← Fetch + socket sync de mensajes
│   │       ├── useUserChats.ts    ← Fetch lista de chats del usuario
│   │       └── useDocuments.ts    ← Fetch de documentos
│   │
│   ├── schemas/            ← Schemas de validación Zod
│   │   └── auth.schema.ts  ← loginSchema, registerSchema
│   │
│   ├── services/           ← Capa de acceso a datos
│   │   ├── api.ts          ← Instancia Axios + interceptores + token helpers
│   │   ├── auth.service.ts ← login, register
│   │   ├── chat.service.ts ← CRUD mensajes, envío de archivos/audio
│   │   ├── socket.service.ts ← Singleton Socket.IO (SocketService)
│   │   ├── user.service.ts ← Perfil, preferencias, búsqueda
│   │   ├── workspace.service.ts ← CRUD workspaces
│   │   └── item.service.ts ← (Documentos/items)
│   │
│   └── types/              ← TypeScript interfaces globales
│       ├── auth.types.ts
│       └── document.types.ts
│
├── assets/
│   ├── fonts/              ← Fuentes: ElmsSans, Nunito, SNPro (Regular + Bold)
│   ├── images/             ← Iconos, splash, adaptive icon
│   ├── sounds/             ← pop.mp3 (sonido de mensaje entrante)
│   └── wallpapers/         ← primary.webp, secondary.webp, tertiary.webp
│
├── .context/               ← Sistema de contexto del proyecto
├── app.json                ← Configuración Expo
├── eas.json                ← Configuración EAS Build
├── tailwind.config.js      ← Colores y fuentes custom de NativeWind
├── global.css              ← Tailwind base styles
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

---

## 3. Capas de la Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    PANTALLAS (app/)                  │
│  index → welcome | home → chat/[id] | workspace/[id]│
│  auth/ → profile/ → user/[id] → documents/          │
└──────────────────────┬──────────────────────────────┘
                       │ usa
┌──────────────────────▼──────────────────────────────┐
│               COMPONENTES (src/components/)          │
│  chat/ | layout/ | shared/ | ui/                    │
└──────────────────────┬──────────────────────────────┘
                       │ usa
┌──────────────────────▼──────────────────────────────┐
│           HOOKS + CONTEXTOS (src/hooks/ + context/)  │
│  useAuth | useChatSocket | useChatMessages           │
│  useUserChats | SocketContext | SocketService        │
└──────────────────────┬──────────────────────────────┘
                       │ usa
┌──────────────────────▼──────────────────────────────┐
│              SERVICIOS (src/services/)               │
│  api.ts (Axios) | *.service.ts | socket.service.ts  │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────┐
│              BACKEND EXTERNO                         │
│  geck-core.onrender.com (REST + Socket.IO)          │
└─────────────────────────────────────────────────────┘
```

---

## 4. Flujo de Autenticación

```
App Start
    │
    ▼
index.tsx (SplashScreen)
    │
    ├─ getToken() → token existe?
    │       │
    │     NO └──→ /welcome → /auth/login | /auth/register
    │       │                     │
    │      SÍ                 signIn() / signUp()
    │       │                     │
    │       ▼                     ▼
    │   /home ←─────── AuthProvider.checkAuth()
    │                       │
    │               /api/users/profile (verifica token)
    │                       │
    │               setUser() → SocketService.connect(userId)
    │                       │
    │               SocketProvider se monta (con userId)
```

**Puntos clave:**
- El token JWT se almacena en AsyncStorage (`@geckchat_token`)
- `AuthProvider` (en `_layout.tsx`) llama `checkAuth()` al montar → verifica token contra el backend
- Si el token es inválido (401), se borra y redirige a `/auth/login`
- El interceptor de respuesta de Axios maneja `401` globalmente y cierra la sesión automáticamente
- `SocketService` (singleton) se conecta en `signIn`/`signUp` y se desconecta en `signOut`

---

## 5. Flujo de Mensajería en Tiempo Real

### 5.1 Doble Canal de WebSocket

El proyecto mantiene **dos instancias paralelas** de Socket.IO:

| Instancia | Dónde vive | Propósito |
|---|---|---|
| `SocketService` (singleton) | `src/services/socket.service.ts` | Canal global: eventos de estado de chats, contadores, presencia |
| `SocketContext` (React Context) | `src/context/SocketContext.tsx` | Canal de sala: eventos de mensajes dentro de una conversación activa |

### 5.2 Flujo de Recepción de Mensaje

```
Servidor emite "new_message" / "message_received"
        │
        ├─── SocketContext.socket.on("new_message")
        │         └── reproduce pop.mp3 (si no es el remitente)
        │
        ├─── useChatMessages (en pantalla de chat activa)
        │         └── queryClient.invalidateQueries(['chatMessages', chatId])
        │
        └─── useChatSocket (en pantalla de chat activa)
                  └── queryClient.setQueryData(['chatMessages', chatId], ...)
                  └── SocketService.emit('mark_read', ...)
                  └── queryClient.invalidateQueries(['userChats'])
```

### 5.3 Eventos Socket Escuchados

| Evento | Handler | Acción |
|---|---|---|
| `new_message` / `message_received` | useChatSocket, ChatList | Actualiza mensajes + lista de chats |
| `message_status_update` | useChatSocket | Actualiza `readBy` / `deliveredTo` de mensajes |
| `chat_status_bulk_update` | useChatSocket, ChatList | Actualiza estados en bloque |
| `message_edited` | useChatSocket, useChatMessages | Actualiza contenido del mensaje |
| `message_deleted` / `message_deleted_for_all` | useChatSocket, useChatMessages | Marca mensaje como eliminado |
| `online_users_list` | SocketContext | Lista inicial de usuarios online |
| `user_online` / `user_offline` | SocketContext | Actualiza presencia |
| `workspace-member-joined` / `workspace-member-left` | useChatSocket | Dispara callback de actualización |
| `chat_deleted` / `new_chat_created` | ChatList | Invalida lista de chats |

### 5.4 Emisiones del Cliente

| Emisión | Cuándo |
|---|---|
| `setup` | Al conectar Socket.IO (envía userId al servidor) |
| `join_chat` | Al abrir una pantalla de chat |
| `leave_chat` | Al salir de una pantalla de chat |
| `get_online_users` | Al conectar SocketContext |
| `mark_read` | Al recibir un mensaje del otro usuario |
| `mark_delivered` | Al recibir cualquier mensaje nuevo en ChatList |

---

## 6. Gestión de Estado

### 6.1 TanStack React Query (Estado del Servidor)

| Query Key | Fuente | Componente |
|---|---|---|
| `['userChats']` | `GET /api/chat/chat` | ChatList |
| `['chatMessages', chatId]` | `GET /api/chat/:id/chat` | Pantalla Chat |
| `['documents']` | (item.service) | Documents |
| `['currentUser']` | (user.service) | Profile |

- `refetchOnWindowFocus: false` (configuración global del QueryClient)
- Retry: máximo 2 veces, excepto en errores `401` (no reintenta)

### 6.2 Zustand (Estado Global Local)

- Disponible en el proyecto pero actualmente no hay stores activos implementados
- Reservado para estado global de UI (ej. selección múltiple de mensajes, etc.)

### 6.3 AuthContext (Estado de Sesión)

- Provee: `user`, `setUser`, `signIn`, `signUp`, `signOut`, `loading`, `checkAuth`
- Vive en `_layout.tsx` envolviendo toda la app
- `user` es `null` si no hay sesión activa

---

## 7. Sistema de Temas (Dark/Light Mode)

```
Usuario selecciona tema en /profile/personalization
        │
        ▼
setColorScheme(mode) [NativeWind]
        │
        ▼
updateUserPreferences(theme) → PATCH /api/users/preferences
        │
        ▼
setUser({ ...user, preferences: { theme: mode } })
        │
        ▼
_layout.tsx useEffect detecta user.preferences.theme
        │
        ▼
setColorScheme() → aplica en toda la app (NativeWind dark: classes)
```

- Los componentes usan clases `dark:` de Tailwind/NativeWind para alternar estilos
- El color del theme se persiste en el backend y se restaura en cada `checkAuth()`
- Valores posibles: `'light'` | `'dark'` | `'system'`

---

## 8. Sistema de Builds (EAS)

### Perfiles de Build

```
eas.json
├── development  → developmentClient: true, distribution: internal
├── preview      → APK, distribution: internal, API: geck-core.onrender.com
└── production   → AAB, autoIncrement: true
```

### Configuración app.json relevante

- **Package Android:** `com.brandonvht26.geckosmobile`
- **Scheme de URL:** `geckosmobile` (deep linking)
- **New Architecture:** Habilitada (`newArchEnabled: true`)
- **React Compiler:** Habilitado (experimental)
- **Typed Routes:** Habilitado (experimental)
- **Edge-to-edge:** Habilitado en Android
- **Predictive back gesture:** Deshabilitado
- **Google Services:** `google-services.json` (Firebase)

---

## 9. Navegación (Expo Router)

El routing es **file-based**. La estructura de `app/` mapea directamente a rutas:

| Archivo | Ruta | Acceso |
|---|---|---|
| `app/index.tsx` | `/` | Splash (guard) |
| `app/welcome.tsx` | `/welcome` | Sin auth |
| `app/auth/login.tsx` | `/auth/login` | Sin auth |
| `app/auth/register.tsx` | `/auth/register` | Sin auth |
| `app/auth/forgot-password.tsx` | `/auth/forgot-password` | Sin auth |
| `app/home.tsx` | `/home` | Autenticado |
| `app/search.tsx` | `/search` | Autenticado |
| `app/chat/[id].tsx` | `/chat/:id` | Autenticado |
| `app/chat/message-info.tsx` | `/chat/message-info` | Autenticado |
| `app/workspace/[id].tsx` | `/workspace/:id` | Autenticado |
| `app/workspace/create.tsx` | `/workspace/create` | Autenticado |
| `app/workspace/invite.tsx` | `/workspace/invite` | Autenticado |
| `app/profile/index.tsx` | `/profile` | Autenticado |
| `app/profile/edit.tsx` | `/profile/edit` | Autenticado |
| `app/profile/change-password.tsx` | `/profile/change-password` | Autenticado |
| `app/profile/personalization.tsx` | `/profile/personalization` | Autenticado |
| `app/user/[id].tsx` | `/user/:id` | Autenticado |
| `app/documents/index.tsx` | `/documents` | Autenticado |

La guarda de autenticación es implícita: `index.tsx` verifica el token y redirige. No hay middleware de auth en el router.

---

## 10. API REST — Endpoints Conocidos

| Método | Endpoint | Servicio |
|---|---|---|
| POST | `/api/auth/login` | auth.service |
| POST | `/api/auth/register` | auth.service |
| GET | `/api/users/profile` | user.service / useAuth |
| PATCH | `/api/users/profile/:id` | user.service |
| PATCH | `/api/users/update-password` | user.service |
| PATCH | `/api/users/preferences` | user.service |
| PATCH | `/api/users/update-push-token` | user.service |
| DELETE | `/api/users/delete-account` | user.service |
| GET | `/api/users/search?q=` | user.service |
| GET | `/api/chat/chat` | chat.service |
| POST | `/api/chat/access` | chat.service |
| GET | `/api/chat/:id/chat?limit=500` | chat.service |
| POST | `/api/chat/message` | chat.service |
| PATCH | `/api/chat/message/:id` | chat.service |
| DELETE | `/api/chat/message/:id` | chat.service |
| POST | `/api/chat/file` | chat.service |
| POST | `/api/chat/audio` | chat.service |
| PATCH | `/api/chat/:id/read` | chat.service |
| DELETE | `/api/chat/:id/delete` | chat.service |
| GET | `/api/workspaces/fetch-user-workspaces` | workspace.service |
| POST | `/api/workspaces/create` | workspace.service |
| POST | `/api/workspaces/invite` | workspace.service |
| DELETE | `/api/workspaces/:id/leave` | workspace.service |
