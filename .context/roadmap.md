# Roadmap - Próxima Sesión

## 1. Revisión Exhaustiva del Chat (Corazón de la App)
- **Manejo de estados y re-renderizados:** Asegurar un rendimiento óptimo de la flatlist y la caché.
- **Envío de archivos y audios:** Comprobar flujos de subida, visualización en el chat y reproducción fluida.
- **Renderizado de mensajes (Interno/Externo):** Confirmar que el último mensaje (texto/audio/archivo) se previsualice correctamente en la lista de chats.
- **Notificaciones / Banderín de no leídos:** 
  - Validar que los chats con mensajes nuevos muestren el indicador en la lista global de `home`.
  - Asegurar que al entrar a un chat con mensajes no leídos se marque la separación temporalmente.
  - Comprobar que al salir y volver a entrar al chat, el banderín de separación de no leídos desaparezca.
- **Modal de Información del Mensaje:**
  - Refactorizar la pantalla de info de mensaje para que se comporte como un Modal nativo y no como una pantalla completa.
  - Eliminar el estado de mensaje "entregado" ya que el backend no lo soporta (dejar solo Enviado / Visto).

## 2. Pulido de UI/UX
- **Alertas y Toasts:** Revisar que todos los mensajes de éxito/error usen el sistema centralizado de Toasts, sin saturar al usuario.
- **Transiciones:** Suavizar las animaciones entre pantallas (navegación y teclados).
- **Consistencia Visual:** Ajustes menores de padding, colores, bordes.

## 3. Verificación de Subida de Imágenes
- Probar el cambio de avatar y wallpaper una vez que el compañero de backend haya aplicado el manejo de errores de Multer en `POST /api/users/preferences`.

## 4. Construcción del APK (Fase Final)
- **Compatibilidad:** Revisar variables de entorno y dependencias nativas en `app.json`.
- **Trial & Error de Build:** Correr `eas build -p android --profile preview` o similar.
- Resolver errores de dependencias de compilación Gradle o SDK si aparecen (esperado).
