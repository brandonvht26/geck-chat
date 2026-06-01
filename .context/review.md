# Tareas Pendientes y Revisión
**Fecha:** 31 de Mayo, 2026

## Por Revisar (Próxima Sesión)

1. **Contador de Mensajes No Leídos (Audios y Archivos)**
   - Corroborar si el backend de tu compañero ya está registrando correctamente los contadores de `unreadCounts` en la base de datos cuando se envían mensajes con audios o archivos (`sendAudioMessage` y `sendFileMessage`).
   - El código para hacer esto requiere el `$inc: { ['unreadCounts.' + memberId]: 1 }` en el backend. Revisar si eso fue finalmente desplegado o implementado sin errores para que el "contador verdecito" del frontend funcione.

2. **Carga y Visualización de Archivos en la App**
   - Verificar de forma exhaustiva que todos los archivos (PDFs, imágenes, etc.) se envíen, se rendericen a tiempo real por los WebSockets en las Workspaces y en los chats individuales, y no existan desincronizaciones de UI con los nuevos nombres seguros.

3. **Participantes Poblados en Sockets (MessageInfoModal)**
   - Monitorear si el evento `receive_message` de WebSockets devuelve mensajes u objetos del chat con usuarios sin el `_id` (`string` crudo), ya que esto causa que momentáneamente el `MessageInfoModal` solo renderice el ID en lugar del nombre del usuario (aunque ya está parchado a nivel UI para no esconderlos). Si ocurre a menudo, se puede solicitar al backend que envíe a los usuarios poblados mediante los sockets.
