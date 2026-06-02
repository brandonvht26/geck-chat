# Construcción y Compilación del APK (Roadmap Final)

El objetivo de esta fase es limpiar minuciosamente cualquier advertencia de dependencias y de esquema de Expo para garantizar que la compilación del APK no solo sea exitosa, sino que la aplicación resultante sea estable y no sufra crasheos en producción.

## 1. Dependencias y Configuración
Tras ejecutar rigurosamente `npx expo-doctor`, el diagnóstico detectó **2 problemas críticos** que podrían haber roto el APK si no los verificábamos:

- **Eliminar `useNextNotificationsApi`:** El esquema moderno de Expo ya no soporta esta propiedad bajo `android`. Mantenerla puede causar un error de validación en los servidores de EAS durante la compilación.
- **Instalación de `expo-asset`:** La librería `expo-audio` requiere estrictamente `expo-asset` como dependencia nativa. Si compilábamos sin esto, la aplicación iba a cerrarse inesperadamente al momento de abrir el chat.

## 2. Variables de Entorno y Assets
- **eas.json:** La configuración para el perfil `preview` está perfecta. Está inyectando tu variable `EXPO_PUBLIC_API_URI = "https://geck-core.onrender.com"`, lo cual es vital para que la app se conecte al servidor real en producción.
- **Assets:** Los archivos (`adaptive_icon.png`, `background.png`, `splash_screen.png`) están referenciados correctamente y existen.

## 3. Plan de Compilación (Siguientes Pasos)
- Instalar la dependencia requerida (`npx expo install expo-asset`).
- Eliminar la propiedad desactualizada en `app.json`.
- Iniciar la compilación ejecutando `eas build -p android --profile preview`.
