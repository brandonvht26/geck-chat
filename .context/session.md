# Resumen de Sesión - Hoy

## 1. Estandarización de Avatares
- Se unificó el uso del componente `UserAvatar` en toda la aplicación para garantizar que los emojis de workspaces y fotos de usuarios se rendericen uniformemente con el mismo diseño y tamaño en todas las vistas.

## 2. Refactorización de Subida de Imágenes (Avatar / Wallpaper)
- Se identificó que `Axios` en React Native corrompe los headers `multipart/form-data`.
- Se migró la lógica de subida en `user.service.ts` y `item.service.ts` a `fetch` nativo.
- Se ajustaron los endpoints para apuntar a `POST /api/users/preferences` en preparación para el despliegue del backend.
- Se añadió un helper `safeJson` para evitar crasheos de la app (SyntaxError) cuando el servidor devuelve páginas de error HTML.
- Se diagnosticó que el servidor arroja un Error 500 desde `Multer` antes de llegar al controlador, dejando listo un prompt definitivo para que el backend lo solucione.

## 3. Corrección de Bugs Críticos
- **Race Condition al Eliminar Grupos:** Se solucionó el error `404 Error fetching chat messages` al eliminar un grupo. Se implementó la limpieza del estado `currentChatId` previo a la navegación y se configuró React Query para ignorar silenciosamente los 404 esperados.
- **Falsos Positivos de Red:** Se evaluó el log de "Error validando sesión" en `useAuth`, confirmando que es un comportamiento normal en Expo Go al recargar, que no afectará la experiencia del usuario en producción (el caché funciona correctamente).