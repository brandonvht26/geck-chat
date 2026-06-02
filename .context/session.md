# Sesión Actual - Estado de GeckChat (02 de Junio de 2026)

## 📌 Contexto y Estado General
En esta sesión intensa de depuración conjunta, se lograron identificar y aislar los problemas reales detrás de los fallos de subida de archivos y audios tanto en el entorno de producción (APK standalone) como en Expo Go. Además, se pulió la experiencia de usuario (refresco en segundo plano) y se fortalecieron los permisos nativos del dispositivo.

---

## 🛠️ Problemas Resueltos en el Frontend (GeckChat Móvil)

### 1. Refresco Inmediato de UI (Background -> Foreground)
- **El Problema:** Al salir de la app (ir al escritorio o a otras apps) y regresar horas después, los datos (chats, mensajes) tardaban demasiado en actualizarse o requerían acción manual.
- **La Solución:** Se inyectó un listener del ciclo de vida de la app (`AppState`) en `app/_layout.tsx`. Ahora, cada vez que el estado cambia a `active`, la app dispara automáticamente `queryClient.refetchQueries()`, forzando a React Query a traer la información fresca en el milisegundo en que la app vuelve a primer plano.

### 2. Archivos y Audios en SDK 54 (Renombrado Explícito)
- **El Problema:** La app enviaba archivos a través de `FileSystem.uploadAsync` directamente desde el caché temporal de Android (`content://` o uris raras) sin una extensión explícita.
- **La Solución:** Se forzó un paso de copiado intermedio. Antes de subir, el archivo/audio se copia a la carpeta segura `Uploads/` e inyectamos a la fuerza el nombre y la extensión real (ej. `mi_archivo.pdf` o `nota_de_voz.m4a`). Esto garantiza que el encabezado `filename` del `multipart/form-data` viaje perfectamente formateado.

### 3. Permisos de Micrófono (El Crash Silencioso)
- **El Problema:** La función `startRecording` llamaba al hardware de audio sin solicitar permiso al sistema. Si el usuario nunca lo dio manualmente en los ajustes de Android/iOS, el `prepareToRecordAsync()` fallaba inmediatamente.
- **La Solución:** Se integró en `app/chat/[id].tsx` y `app/workspace/[id].tsx` el ciclo de vida oficial: `getRecordingPermissionsAsync` y `requestRecordingPermissionsAsync`. Ahora aparece el prompt nativo y un toaster descriptivo si se deniega.
- **Nota extra sobre Galería y Archivos:** Se confirmó que el perfil usa correctamente `ImagePicker.requestMediaLibraryPermissionsAsync()`, mientras que la selección de archivos usa `DocumentPicker` que funciona a través del Storage Access Framework (SAF) y **no requiere permisos globales de lectura** por diseño del SO.

### 4. Error de ReferenceError: Platform
- Se detectó en los logs un crasheo de Expo Go: `Property 'Platform' doesn't exist`.
- **Solución:** Se inyectó el `import { Platform } from 'react-native';` faltante en `src/services/item.service.ts`.

---

## 🚨 LA CAUSA RAÍZ EN EL BACKEND (geck-core)

A pesar de que el frontend ya envía los datos perfectamente, el servidor rechazaba la subida a Mis Documentos con el mensaje *"No se ha seleccionado ningún archivo"*. Tras inspeccionar el repositorio backend (`geck-core-tmp`), se descubrió la verdadera causa:

- **Colisión de Middlewares:** En `src/app.js` (Línea 36), el backend implementa `express-fileupload` de manera global para todas las rutas. Sin embargo, en `src/routers/item_routes.js`, se utiliza **Multer** (`upload.single('archivo')`). 
- **Efecto Domino:** `express-fileupload` consume el stream multipart antes de que Multer lo alcance. Multer lee un stream vacío, dejando `req.file = undefined`. Finalmente, el controlador `uploadFileItem` falla lanzando el mensaje mencionado.
- **Pendiente para el Backend:** El desarrollador del backend debe agregar una exclusión en `app.js` para que `express-fileupload` ignore `/api/items/upload` (dejando que Multer haga su trabajo), o remover Multer de `item_routes.js` y usar `req.files.archivo`.

---

## 🚀 Estado Actual y Próximos Pasos
- Todos los fallos, crashes y falta de robustez del código frontend **están parchados**.
- La rama `main` en GitHub está actualizada con los fixes de permisos, renombrado de archivos, refetch de background e import de Platform.
- Se recomienda compilar el APK (`eas build -p android --profile preview`) **sólo después** de que el desarrollador del backend aplique el fix en su repositorio y reinicie el servidor de producción.
