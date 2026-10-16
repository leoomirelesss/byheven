# Proceso editorial ligado al scroll

El home conserva sus rutas y su fondo continuo. «Cómo trabajamos» es una isla React pre-renderizada: las cuatro etapas están en el HTML de producción y después se hidratan sin reemplazarlas.

## Estructura

- Componente: `components/ui/process-story.tsx`.
- Datos del home: `components/process-cards.tsx`.
- Controlador: `lib/process-story-motion.ts`.
- Estilos: `assets/process-story.css`.
- Hidratación: `src/process-cards.tsx`.
- Tailwind: `styles/components.css`; `cn`: `lib/utils.ts`.

`components/ui` es el destino configurado para shadcn. `components.json` y `tsconfig.json` resuelven `@/` hacia la raíz. React, TypeScript y Tailwind ya están instalados; no ejecutar `init` de nuevo. En un proyecto nuevo, empezar con `npx shadcn@latest init`; aquí se pueden añadir componentes con `npx shadcn@latest add <nombre>`, revisando los cambios de CSS antes de compilar. Tailwind importa tema/utilidades sin Preflight para respetar el home.

## Composición y movimiento

Sin iconos, imágenes ni tarjetas. A la izquierda, título e índice vertical con un trazo fino; a la derecha, una etapa cada vez, con título grande en dos líneas, descripción y tres detalles breves. El fondo general sigue visible. No se añade otra superficie de color ni se modifica el resto del home.

Una sola secuencia GSAP/ScrollTrigger sigue el scroll nativo con `scrub: .45`. Cada título asciende por máscaras de línea, se detiene para lectura y vuelve a subir antes de entrar el siguiente. El contenido acompaña la transición; la etapa anterior desaparece antes de la siguiente. Al regresar con scroll, la secuencia se recorre hacia atrás. El índice arranca vacío y avanza con el mismo recorrido.

La escena usa CSS sticky, sin pin de GSAP, captura global de rueda/touch, autoavance ni bucle permanente. Dura 320svh en escritorio y 300svh en móvil, incluyendo la pantalla visible: el recorrido efectivo es de 220/200svh. La última etapa permanece legible antes de liberar la escena hacia el FAQ. Se espera a las fuentes antes de medir y se refrescan los triggers después de activar la altura de la escena.

Las líneas se componen de forma explícita y cada título conserva su nombre completo en `aria-label`. No hace falta SplitText ni división de texto en ejecución. `gsap.matchMedia` limita los efectos al componente y revierte estilos y triggers en resize, cambio de preferencias o desmontaje. Movimiento reducido, ventanas de menos de 650px de alto y falta de matchMedia usan una lista normal, sin contenido enmascarado ni sección fijada. Sin JavaScript, el HTML pre-renderizado también presenta las cuatro etapas.

Los anteriores archivos Zoom Slider y su controlador se retiraron. `GradientCard` y su demo original siguen disponibles de manera independiente. Los iconos anteriores se conservan como recursos, pero este proceso no los importa ni solicita.

## Verificación

Con Node 22 o superior:

```bash
npm ci
npm run build
```

El build ejecuta TypeScript estricto y doce fixtures del controlador real con dobles de GSAP: secuencia única vinculada al scroll, entradas y salidas ordenadas, pausa de lectura, índice vacío al inicio, última etapa persistente, cambios de ancho/preferencia, SSR y limpieza. El build publica `dist/` conservando las rutas y los recursos existentes.

Se comprobó además la hidratación con React y GSAP/ScrollTrigger reales en un DOM: cuatro estados de lectura, entrada progresiva, salida hacia arriba, regreso, índice desde cero, fallbacks estáticos, ausencia de imágenes/iconos y conservación exacta de los bloques vecinos. Estas verificaciones no sustituyen una revisión visual en navegador; el preview requiere iniciar sesión en Vercel en la sesión disponible.

Referencias de API: https://gsap.com/docs/v3/Plugins/ScrollTrigger/ · https://gsap.com/docs/v3/GSAP/gsap.matchMedia/
