# Registro de Revisiones Pendientes (Review)

> [!IMPORTANT]  
> **REGLA DE ORO PARA TODOS LOS MODELOS AI:** 
> Este archivo `review.md` es un documento flotante y vivo diseñado para anotar tareas, errores o características que han sido "aparentemente" solucionadas o implementadas, pero que **están pendientes de verificación o prueba real** (por ejemplo, a la espera de cambios en el backend u otros bloqueos externos). 
> **NUNCA** elimines un elemento de esta lista a menos que el usuario (Brandon) confirme explícitamente que la característica ha sido probada con éxito y funciona de manera afirmativa. Una vez el usuario lo confirme, debes eliminar el punto respectivo de este archivo para mantenerlo limpio. Esta regla es inquebrantable.

---

## 📝 Tareas Pendientes de Verificación

- [ ] **Subida de Imágenes (Avatar y Wallpaper de Chats):** 
  - **Contexto:** Se cambió la petición en `user.service.ts` de `PATCH` a `POST` debido a que la infraestructura de despliegue bloqueaba silenciosamente los cuerpos `multipart/form-data` en las peticiones `PATCH`.
  - **Estado:** A la espera de que el equipo de backend agregue la ruta `router.post('/preferences', upload.single('image'), updatePreferences);` en `user_routes.js`.
  - **Acción requerida:** Una vez el backend sea actualizado, el usuario probará subir una foto de perfil y un fondo de pantalla para chats desde la app móvil. Si el cambio se refleja exitosamente en la UI y base de datos sin errores, borrar este ítem.

- [ ] **Revisión Exhaustiva del Chat (UI y Estados):**
  - **Contexto:** Se implementó un Modal real para la Info de los mensajes, se eliminó el estado "Entregado" y se optimizó el caché de mensajes para evitar falsos banderines de "No Leídos" al re-ingresar al chat. Además, se añadió restricción de 5MB en envío de archivos.
  - **Estado:** Implementado en frontend, pendiente de prueba manual por el usuario.
  - **Acción requerida:**
    1. Entrar a un chat con mensajes no leídos: verificar que aparezca el separador de "Mensajes no leídos".
    2. Salir del chat y volver a entrar de inmediato: verificar que el separador ya NO aparezca (se optimizó la caché).
    3. Enviar un mensaje: revisar los checks (1 check gris = Enviado, 2 azules = Leído).
    4. Long-press en un mensaje propio -> "Info": verificar que se abre un Modal inferior, mostrando correctamente solo "Leído por" y "Pendiente".
    5. Probar subir un archivo mayor a 5MB: verificar que la alerta de límite de peso bloquee la acción.

- [ ] **Pulido de UI/UX (Sección 2):**
  - **Contexto:** Se reemplazaron las alertas de error nativas por notificaciones Toast y se configuró la transición `slide_from_right` en el Stack principal para mayor suavidad.
  - **Estado:** Implementado, pendiente de verificación visual.
  - **Acción requerida:** Navegar entre pantallas para comprobar la suavidad de las transiciones, intentar subir archivos pesados para confirmar que aparece el Toast en lugar del Alert invasivo, y verificar que los Dialogs nativos se mantienen solo para confirmaciones críticas.
