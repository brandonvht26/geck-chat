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

## 4. Revisión Exhaustiva del Chat (Sección 1)
- **Modal Nativo para Info:** Se eliminó la ruta `/chat/message-info` y se integró un auténtico `<MessageInfoModal />` interno para evitar saltos de pantalla antinaturales al revisar quién leyó un mensaje.
- **Simplificación de Estados:** Se eliminó el redundante estado "Entregado" del Frontend y Socket. Ahora solo existe "Enviado" (1 check) y "Leído" (2 checks).
- **Caché Optimizado:** Se corrigió el bug del banderín de "Mensajes No Leídos" fantasma estableciendo un `staleTime` de 1 minuto y mutando el caché instantáneamente al entrar a la sala.

## 5. Pulido de UI/UX (Sección 2)
- **Toasts Centralizados:** Se reemplazaron todas las alertas toscas del SO (`Alert.alert`) por notificaciones Toast de `sonner-native` (ej. Error al subir archivos o límite de 5MB superado). Solo se mantuvieron las alertas nativas para acciones destructivas (eliminar mensajes o abandonar grupos).
- **Transiciones Nativas:** Se configuró globalmente la animación `slide_from_right` en el `Stack` para suavizar la navegación, igualando la experiencia fluida de iOS en dispositivos Android.