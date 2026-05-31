# 🎨 UI/UX SKILL — GeckChat

> ✅ **Puede actualizarse con autorización del owner (Brandon).**
> ❌ **No puede eliminarse.**
> Este archivo es la fuente de verdad para toda decisión visual y de interacción en GeckChat.
> Antes de implementar cualquier componente visual, **leer este archivo completo**.

---

## 1. Paleta de Colores

Definida en `tailwind.config.js`. **No inventar colores fuera de esta paleta.**

### Colores Primarios

| Token | Light Mode | Dark Mode | Uso |
|---|---|---|---|
| `primary` | `#2A72D4` (Azul Zafiro) | `#8261D4` (Amatista) | Botones principales, burbujas propias, badges, FAB |
| `secondary` | `#D9821E` (Ámbar Meloso) | `#EAA945` (Dorado Pastel) | Acentos secundarios |
| `tertiary` | `#93BE38` (Verde Lima) | `#BBE068` (Verde Lima Pastel) | Wallpaper "Lima", acentos terciarios |
| `warning` | `#E14B4B` (Rojo Alerta) | `#ED7474` (Rojo Desaturado) | Errores, alertas destructivas, grabación de audio |

### Colores de Texto

| Token | Light Mode | Dark Mode |
|---|---|---|
| `textMain` | `#141E30` (Azul muy oscuro) | `#EBF1FA` (Blanco azulado) |

### Colores de Fondo

| Token | Light Mode | Dark Mode | Uso |
|---|---|---|---|
| `authStart` | `#EBF4FC` | `#0B131F` | Inicio de gradiente en pantallas auth |
| `authEnd` | `#FFFBF5` | `#161121` | Fin de gradiente + fondo principal de la app en dark |
| `glass` | `#ffffffb8` | `#ffffff0f` | Elementos con glassmorphism |

### Colores de Sistema (Tailwind estándar, usados en el proyecto)

| Uso | Clase |
|---|---|
| Bordes sutiles light | `border-gray-100`, `border-gray-200` |
| Bordes sutiles dark | `border-zinc-800`, `border-zinc-700` |
| Fondos de tarjetas dark | `bg-zinc-900`, `bg-zinc-800` |
| Texto secundario light | `text-gray-500`, `text-gray-400` |
| Texto secundario dark | `text-gray-400`, `text-gray-500` |
| Mensajes online | `bg-green-500` (verde) |
| Estado "leído" | `#34d399` (verde esmeralda, usado inline) |

---

## 2. Tipografía

Definida en `tailwind.config.js` y cargada en `_layout.tsx` con `useFonts`.

### Familias de Fuentes

| Token NativeWind | Archivo | Uso Principal |
|---|---|---|
| `font-elms` | `ElmsSans-Regular.ttf` | Textos de apoyo, subtítulos pequeños |
| `font-elms-bold` | `ElmsSans-Bold.ttf` | Etiquetas, textos estáticos de marca |
| `font-nunito` | `Nunito-Regular.ttf` | Cuerpo de texto, mensajes, inputs, placeholders |
| `font-nunito-bold` | `Nunito-Bold.ttf` | **Fuente principal de UI** — nombres, labels, botones |
| `font-snpro` | `SNPro-Regular.ttf` | Timestamps, metadatos, textos pequeños |
| `font-snpro-bold` | `SNPro-Bold.ttf` | Títulos de pantalla, headers, sección labels |

### Jerarquía Tipográfica

| Elemento | Clase(s) |
|---|---|
| Título de pantalla (header) | `text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight` |
| Nombre de app (splash/login) | `text-5xl font-nunito-bold text-textMain dark:text-textMain-dark tracking-tight` |
| Nombre en lista de chats | `text-base font-nunito-bold text-textMain dark:text-textMain-dark` |
| Mensaje de chat | `text-[15px] font-nunito-regular leading-5` |
| Timestamp de mensaje | `text-[10px] font-snpro-regular text-gray-400` |
| Label de sección | `text-sm font-snpro-bold text-gray-500 dark:text-gray-400` |
| Texto de apoyo/descripción | `text-sm font-nunito-regular text-gray-500 dark:text-gray-400` |
| Badge de notificaciones | `text-xs font-snpro-bold text-white` |
| Input de chat | `text-base font-nunito-regular text-textMain dark:text-textMain-dark` |

---

## 3. Fondos de Pantalla (App Background)

### Pantalla Principal (Home, Chats, Perfil)
- **Light:** `bg-white`
- **Dark:** `bg-authEnd-dark` (`#161121`)

### Pantallas de Autenticación
- **Background de entrada:** Color `primary` / `primary-dark` con degradado animado (WaveBackground)
- **Fondo de formulario:** `bg-white dark:bg-authEnd-dark`

### Fondos de Chat (Wallpapers de usuario)
- Tres wallpapers bundled: `assets/wallpapers/primary.webp`, `secondary.webp`, `tertiary.webp`
- Nomeclatura interna: `bundled:primary`, `bundled:secondary`, `bundled:tertiary`
- También puede ser una URL de imagen subida por el usuario

---

## 4. Animaciones — Patrones Estándar

Todas las animaciones usan **React Native Reanimated 4**. Importar desde `react-native-reanimated`.

### 4.1 Botón "Squish" (AnimatedSquishBtn / AnimatedSquishButton)

El patrón más usado en toda la app. Se aplica a cualquier botón principal o acción.

```tsx
const scale = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

// En el Pressable:
onPressIn={() => { scale.value = withSpring(0.85, { damping: 15 }); }}
onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
```

- **Escala en press:** `0.85` (botones pequeños) o `0.94` (botones grandes/items de lista)
- **Damping:** `15` (estándar), `12` para inputs (efecto más "vivo")
- **Ejemplo de uso:** Botón de enviar, botón de creación, items de personalización

### 4.2 Fila de Lista "Fade" (AnimatedFadeRow)

Para listas de chats y filas scrolleables. Más sutil que el Squish.

```tsx
const opacity = useSharedValue(1);
const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

onPressIn={() => { opacity.value = withTiming(0.5, { duration: 100 }); }}
onPressOut={() => { opacity.value = withTiming(1, { duration: 200 }); }}
```

### 4.3 Animación de Entrada (FadeInDown)

Para elementos que aparecen en pantalla por primera vez:

```tsx
import { FadeInDown } from 'react-native-reanimated';

<Animated.View entering={FadeInDown.delay(300).duration(800)}>
```

- Delays escalonados: `100ms`, `300ms`, `500ms` para crear efecto cascada

### 4.4 Animación de Pulso (Pulsing) — Estado de Grabación

```tsx
const opacity = useSharedValue(1);
opacity.value = withRepeat(
  withSequence(
    withTiming(0.4, { duration: 500 }),
    withTiming(1, { duration: 500 })
  ),
  -1, // infinito
  true
);
```

### 4.5 Animación de Círculos (Splash Screen)

```tsx
scale.value = withRepeat(
  withTiming(1.2, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
  -1,
  true
);
```

### 4.6 Indicador de Tab Deslizante

```tsx
// withSpring para el indicador de tab activo:
transform: [{ translateX: withSpring(activeTab === 'privados' ? 0 : TAB_WIDTH - 8, { damping: 20, stiffness: 90 }) }]
```

### 4.7 Aparición/Desaparición del Botón Crear (withTiming sin bounce)

```tsx
// Para animar width/opacity sin overshoot:
width: withTiming(isVisible ? 44 : 0, { duration: 200 }),
opacity: withTiming(isVisible ? 1 : 0, { duration: 150 }),
marginLeft: withTiming(isVisible ? 12 : 0, { duration: 200 })
```

---

## 5. Componentes de Input

### 5.1 Input de Autenticación (AnimatedInput)

- **Fondo:** `bg-white/20` con `border border-white/30` (glassmorphism sobre fondo de color)
- **Texto:** `text-white text-base font-nunito-regular`
- **Placeholder:** `rgba(255,255,255,0.6)` (siempre hardcodeado, no clase Tailwind)
- **Animación en focus:** `withSpring(1.02, { damping: 12 })` → sutil agrandamiento
- **Icono:** Feather a la izquierda, color `white`
- **Toggle de contraseña:** Feather `eye` / `eye-off`, color `rgba(255,255,255,0.8)`

### 5.2 Input de Chat (ChatInput)

- **Contenedor:** `flex-row items-end bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-3xl`
- **TextInput:** `flex-1 min-h-[40px] max-h-[100px] text-base font-nunito-regular`
- **Multiline:** `true` (crece hasta 100px máximo)
- **Placeholder text:** `colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'` (siempre inline, no clase)
- **Safe area:** padding dinámico usando `useSafeAreaInsets()` + detección de teclado

### 5.3 Input de Búsqueda

- **Contenedor:** `flex-row items-center bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl px-3 h-11`
- **Icono:** Feather `search`, color `#9CA3AF`
- **TextInput:** `flex-1 ml-2 text-base font-nunito-regular text-textMain dark:text-textMain-dark`
- **Botón clear (X):** Feather `x-circle`, aparece solo cuando `value.length > 0`

---

## 6. Sistema de Burbujas de Mensaje (MessageBubble)

### 6.1 Clases Base

```
bubbleBase: "max-w-[85%] px-3.5 pt-2.5 pb-1.5 rounded-3xl mb-1.5 shadow-sm"
```

### 6.2 Burbuja Propia (isMe)

```
"bg-primary dark:bg-primary-dark self-end rounded-br-sm"
texto: "text-white"
```

### 6.3 Burbuja Ajena

```
"bg-white dark:bg-zinc-800 self-start rounded-bl-sm border border-gray-100 dark:border-zinc-700/50"
texto: "text-textMain dark:text-textMain-dark"
```

### 6.4 Estados de Mensaje

| Estado | Ícono | Color |
|---|---|---|
| `sent` | `checkmark` (Ionicons) | `#ffffff80` |
| `delivered` | `checkmark-done` (Ionicons) | `#ffffff80` |
| `read` | `checkmark-done` (Ionicons) | `#34d399` (verde) |

### 6.5 Tipos de Mensaje

| Tipo | Renderizado |
|---|---|
| `text` | `<Text>` simple |
| `audio` | `AudioPlayerComponent` + botón de descarga |
| `file` | Ícono `document-text` + nombre + "Toca para descargar" |
| Eliminado | Ícono `slash` + "Mensaje eliminado" (italic) |
| Expirado | Ícono `document-outline` + "Archivo expirado (24h)" |

---

## 7. Sistema de Toasts (Sonner Native)

**Única librería de toasts permitida:** `sonner-native`

### Configuración global (en `_layout.tsx`):

```tsx
<Toaster
  theme={colorScheme === 'dark' ? 'dark' : 'light'}
  position="top-center"
  offset={50}
  duration={1500}  // ← ESTÁNDAR: 1.5 segundos
  toastOptions={{
    titleStyle: { fontFamily: 'Nunito-Bold' },
    descriptionStyle: { fontFamily: 'Nunito-Regular' }
  }}
/>
```

### Uso estándar:

```tsx
import { toast } from 'sonner-native';

// Éxito simple
toast.success('¡Operación exitosa!');

// Error con descripción
toast.error('Título del error', { description: getErrorMessage(error) });

// Operación async (más usada para llamadas a API)
toast.promise(miPromise, {
  loading: 'Guardando...',
  success: () => '¡Guardado correctamente!',
  error: () => 'Error al guardar. Inténtalo de nuevo.'
});
```

### Reglas de Toasts:
- **Nunca usar `Alert.alert()`** para feedback de usuario → siempre Sonner
- Mensajes de éxito: cortos, positivos, con `¡` al inicio
- Mensajes de error: siempre usar `getErrorMessage(error)` de `src/services/api.ts` para errores HTTP

---

## 8. Modales

Patrón estándar para bottom sheets / modales:

```tsx
<Modal visible={showModal} transparent animationType="fade">
  {/* Overlay oscuro que cierra el modal al presionar */}
  <Pressable className="flex-1 bg-black/60 justify-end" onPress={() => setShowModal(false)}>
    {/* Contenedor del modal — stopPropagation para no cerrar al tocar dentro */}
    <Pressable
      className="bg-white dark:bg-authEnd-dark rounded-t-3xl px-6 pt-6"
      style={{ paddingBottom: Math.max(insets.bottom, 24) }}
      onPress={(e) => e.stopPropagation()}
    >
      {/* Handle visual */}
      <View className="w-12 h-1.5 bg-gray-200 dark:bg-zinc-700 rounded-full self-center mb-6" />
      
      {/* Contenido del modal */}
    </Pressable>
  </Pressable>
</Modal>
```

---

## 9. Headers de Pantalla

### Patrón MainHeader (pantalla principal)

```tsx
// En MainHeader.tsx — header de la pantalla principal
// Incluye: botón de menú (hamburger) + logo "GeckChat" centrado + botón de búsqueda
```

### Patrón Header Secundario (pantallas internas)

Usado en `personalization.tsx`, `profile/`, etc.:

```tsx
<View style={{ paddingTop: insets.top }} className="bg-white dark:bg-authEnd-dark z-20">
  <View className="flex-row justify-between items-center px-4 py-3 bg-white dark:bg-authEnd-dark border-b border-gray-100 dark:border-gray-800">
    {/* Botón back */}
    <Pressable onPress={() => router.back()} className="p-2 -ml-2 active:opacity-60">
      <Feather name="arrow-left" size={24} color={colorScheme === 'dark' ? '#E5E7EB' : '#333333'} />
    </Pressable>

    {/* Título centrado */}
    <Text className="text-2xl font-snpro-bold text-textMain dark:text-textMain-dark tracking-tight">
      Título
    </Text>

    {/* View fantasma para centrar matemáticamente el título */}
    <View className="p-2 -mr-2 opacity-0" pointerEvents="none">
      <Feather name="arrow-left" size={24} />
    </View>
  </View>
</View>
```

**IMPORTANTE:** El "View Fantasma" (`opacity-0`) es intencional y necesario para centrar el título correctamente cuando hay un botón solo en un lado.

---

## 10. Iconos

- **Librería:** `@expo/vector-icons` — se usan exclusivamente **Feather** e **Ionicons**
- `Feather` → Acciones, UI funcional (search, arrow-left, paperclip, trash-2, etc.)
- `Ionicons` → Estado, contenido (chatbubbles, checkmark, checkmark-done, person, people, etc.)
- **No mezclar** con otras librerías de iconos
- El color del icono siempre se pasa como prop `color` con valor hexadecimal o inline (no clase Tailwind)

### Colores de icono más usados:

```tsx
// Light mode → color oscuro
color={colorScheme === 'dark' ? '#E5E7EB' : '#333333'}  // Headers principales
color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'}  // Iconos secundarios/acciones
color={colorScheme === 'dark' ? '#9CA3AF' : '#9CA3AF'}  // Placeholders/búsqueda

// Siempre blanco (sobre fondos de color)
color="#ffffff"  // Sobre primary/secondary

// Colores de estado
color="#EF4444"  // Rojo (alerta, grabación)
color="#34d399"  // Verde (mensaje leído)
color="#2A72D4"  // Primary light (hardcoded para iconos de grupo)
```

---

## 11. Fondos de Pantalla de Chat (Wallpaper)

La pantalla de chat (`app/chat/[id].tsx`) soporta wallpaper personalizado por usuario:

- **Sin wallpaper:** `bg-gray-50 dark:bg-zinc-950` (fondo plano)
- **Con wallpaper bundled:** `Image` de `assets/wallpapers/[type].webp` como fondo absoluto
- **Con wallpaper de galería:** `Image` con `source={{ uri: url }}` como fondo absoluto
- Siempre con `resizeMode="cover"` y `style={{ position: 'absolute', ... }}`

---

## 12. Indicadores de Estado Online

```tsx
{isOnline && <View className="w-1.5 h-1.5 rounded-full bg-green-500" />}
```

- Punto verde pequeño (`w-1.5 h-1.5`)
- `bg-green-500` (Tailwind estándar)
- Se muestra en: nombres de remitentes en grupos, avatares en listas

---

## 13. Sonidos

- **Sonido de mensaje entrante:** `assets/sounds/pop.mp3`
- Se reproduce en `SocketContext.tsx` usando `expo-audio` (`useAudioPlayer`)
- Solo se reproduce cuando el mensaje NO es del usuario actual (`senderId !== userId`)

---

## 14. Dependencias UI Instaladas

| Paquete | Versión | Uso |
|---|---|---|
| `nativewind` | `^4.2.3` | Estilos (Tailwind en RN) |
| `tailwindcss` | `^3.3.2` | Motor de Tailwind |
| `react-native-reanimated` | `~4.1.1` | Animaciones |
| `react-native-gesture-handler` | `~2.28.0` | Gestos (base para animaciones) |
| `react-native-safe-area-context` | `~5.6.0` | Safe area insets |
| `react-native-screens` | `~4.16.0` | Optimización de screens |
| `react-native-svg` | `^15.12.1` | SVG support |
| `expo-image` | `~3.0.11` | Imágenes optimizadas |
| `expo-haptics` | `~15.0.8` | Feedback háptico |
| `@expo/vector-icons` | `^15.0.3` | Feather + Ionicons |
| `sonner-native` | `^0.24.0` | Toast notifications |
| `expo-symbols` | `~1.0.8` | SF Symbols (iOS) |
