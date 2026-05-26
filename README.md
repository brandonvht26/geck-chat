# 🦎 GeckChat - Mobile App

**GeckChat** es el componente móvil nativo del ecosistema [GeckOS](https://geck-os.netlify.app/). Esta aplicación unifica una plataforma de mensajería instantánea y colaboración en tiempo real, ofreciendo chats privados, espacios de trabajo grupales (Workspaces), intercambio de archivos multimedia y un sistema de personalización de interfaz de alto nivel.

---

## 🎓 Contexto Académico

* **Institución:** Escuela Politécnica Nacional del Ecuador
* **Facultad:** Escuela de Formación de Tecnólogos (ESFOT)
* **Carrera:** Tecnología Superior en Desarrollo de Software
* **Año:** 2026
* **Desarrollado por:** Brandon Vinicio Huera Torres

---

## 🚀 Stack Tecnológico

El proyecto ha sido construido utilizando las mejores y más modernas herramientas del desarrollo móvil y web:

**Frontend (Móvil):**
* **Framework:** React Native con Expo (SDK 54)
* **Navegación:** Expo Router (Navegación basada en archivos)
* **Estilos y UI:** NativeWind (Tailwind CSS para React Native) y Glassmorphism
* **Animaciones:** React Native Reanimated (Físicas elásticas "Squish" y transiciones fluidas)
* **Gestión de Estado y Caché:** React Query (@tanstack/react-query)
* **Multimedia:** Expo Audio, Expo Image Picker, Expo Document Picker

**Backend & Conectividad:**
* **Tiempo Real:** Socket.io-client (Sincronización instantánea de mensajes y estados)
* **Peticiones HTTP:** Axios (con interceptores para gestión de JWT)
* **Almacenamiento en la nube:** Integración con Cloudinary (vía API backend) para imágenes y notas de voz.

---

## 🛠️ Características Principales

* **Mensajería en Tiempo Real:** Comunicación fluida sin latencia perceptible.
* **Workspaces Colaborativos:** Creación de grupos de trabajo con gestión de miembros.
* **Notas de Voz Inteligentes:** Interfaz de grabación fluida con cancelación de gestos y visualización de progreso.
* **Gestor de Documentos:** Sistema integrado para clasificar, visualizar y descargar archivos (PDF, Excel, Word, Código).
* **Personalización (Theming):** Modo claro/oscuro automatizado y fondos de chat dinámicos.
* **UX/UI Premium:** Componentes responsivos que respetan los *Safe Areas* (Notch y Home Indicator) tanto en iOS como en Android, junto con soporte nativo de teclado (`KeyboardAvoidingView` calibrado).

---

## 📦 Indicaciones Generales (Para Desarrolladores)

Si deseas clonar y correr este proyecto en un entorno local, sigue estos pasos:

### 1. Requisitos Previos
* Node.js instalado (v18 o superior).
* Cuenta de [Expo](https://expo.dev/) activa.
* Emulador de Android/iOS o la aplicación **Expo Go** instalada en un dispositivo físico.

### 2. Instalación
Clona el repositorio e instala las dependencias:
```bash
git clone <https://github.com/brandonvht26/geck-chat.git>
cd geckos-mobile
npm install