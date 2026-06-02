# Sesión Actual - Estado de GeckChat (02 de Junio de 2026)

## 📌 Contexto del Problema
Se reportó que en el APK de producción (Android compilado como standalone), la subida de documentos pesados y el envío de audios en chats fallaba con errores de "Error de conexión con el servidor" o "No se pudo subir el documento". Curiosamente, estas mismas acciones funcionaban a la perfección en el entorno de desarrollo (Expo Go). Además, la subida de imágenes de perfil (Avatar) y fondos de pantalla desde la galería SÍ funcionaba en el APK.

## 🐛 Diagnóstico y Caza del Bug
1. **Fase 1 (Axios vs FormData):** 
   Se identificó que el backend (Multer) recibía las peticiones pero rechazaba los archivos devolviendo status `400` y el mensaje *"No se ha seleccionado ningún archivo."* 
   Se intentó reescribir `FileSystem.uploadAsync` usando `fetch` y `FormData` puro asumiendo que era un bloqueo de WAF.
   *Resultado:* `fetch` nativo también falló por un bug conocido en la Nueva Arquitectura de React Native 0.76 (Fabric) que corrompe los streams de `FormData`.
   
2. **Fase 2 (New Architecture):** 
   Se intentó desactivar `"newArchEnabled": false` en `app.json` para volver al motor de red de OkHttp, pero EAS Build falló en la fase de Gradle, ya que Expo SDK 52 y ciertos módulos modernos exigen mantener la nueva arquitectura encendida.

3. **Fase 3 (El Villano Real - `copyAsync`):** 
   Al analizar por qué la actualización de Avatar SÍ funcionaba con `FileSystem.uploadAsync` y el audio/documento NO, se descubrió la diferencia clave: **`FileSystem.copyAsync`**.
   En las funciones originales, se forzaba la copia del archivo a la caché (`FileSystem.cacheDirectory`) antes de subirlo. En el SDK 52 con Android estricto, copiar URIs tipo `content://` protegidas o directamente desde el buffer de grabación a veces falla de forma silenciosa, creando un archivo de **0 bytes**.
   El servidor recibía literalmente un archivo vacío, lo que provocaba el error de Multer de "archivo no seleccionado".

## 🛠️ Solución Aplicada (Definitiva)
- Se **eliminó por completo el uso de `FileSystem.copyAsync`** en `item.service.ts` y `chat.service.ts`.
- Se procedió a enviar la **URI cruda/nativa** (`fileUri` / `recording.uri`) directamente al método `FileSystem.uploadAsync`, replicando de forma 1:1 el comportamiento exitoso que tiene la subida de Avatares (`user.service.ts`).
- Se ajustaron los MIME types (usando fallbacks como `application/pdf` en lugar del problemático `application/octet-stream` para que Android no elimine la extensión).
- Se modificó el manejo de errores para extraer el mensaje HTTP directo del backend en lugar de mostrar un error genérico.

## 🚀 Estado Actual
- **El código está corregido, commiteado y pusheado** a GitHub en la rama principal.
- Hay una **compilación de EAS (Android APK) ejecutándose en background** (Lanzada a las 01:56 AM).
- **Pendiente para mañana:** Instalar el nuevo APK una vez que finalice la compilación, limpiar la caché anterior de la app, y realizar las pruebas finales de subida de audios y documentos.
