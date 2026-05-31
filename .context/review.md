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
