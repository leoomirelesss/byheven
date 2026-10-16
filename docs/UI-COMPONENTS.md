# Proceso editorial con Zoom Slider

El home conserva su HTML y sus rutas. «Cómo trabajamos» es una isla React pre-renderizada: las cuatro etapas ya existen en el HTML de producción y después se hidratan sin reemplazarlo.

## Rutas y estructura

- Zoom Slider adaptado: `components/ui/zoom-slider.tsx`.
- Demo independiente: `components/ui/zoom-slider-demo.tsx`.
- Datos del home: `components/process-cards.tsx`.
- Ciclo de animación: `lib/zoom-slider-motion.ts`.
- Estilos: `assets/process-story.css`.
- Entrada de hidratación: `src/process-cards.tsx`.
- Tailwind: `styles/components.css`.
- `cn`: `lib/utils.ts`.

`components/ui` es el destino configurado para shadcn; mantiene estables las importaciones `@/components/ui/...`. `components.json` y `tsconfig.json` resuelven `@/` hacia la raíz. React, TypeScript y Tailwind ya están instalados: no hace falta ejecutar `init` sobre este proyecto. Para un proyecto nuevo, `npx shadcn@latest init` permite crear la base React/TypeScript; aquí, `npx shadcn@latest add <nombre>` añade componentes al destino existente. Revisar los cambios de CSS antes de compilar.

## Diseño y movimiento

La nueva composición combina las filas editoriales de la grabación de Moyra con el crecimiento progresivo de imágenes del Zoom Slider adjunto. Sustituye la curva en S por cuatro filas: visual a la izquierda, número/título/explicación al centro y un desglose breve a la derecha. En tablet, los detalles bajan junto al texto; en móvil se apila el contenido. El fondo general del home permanece continuo. Los cuatro visuales reutilizan los iconos propios sobre una composición editorial, sin imágenes externas ni base64 de la referencia.

El componente suministrado se adaptó al flujo vertical de este one-page. No crea un carrusel infinito, una pantalla negra separada ni un controlador global de rueda/arrastre. GSAP 3.15.0, ScrollTrigger y SplitText vinculan el zoom al scroll nativo de cada fila. El marco crece desde su esquina inferior; el visual interior acompaña el movimiento y el título aparece por líneas enmascaradas. Los párrafos y detalles conservan visibilidad durante la transición.

El componente espera a que las fuentes estén listas antes de dividir los títulos. `autoSplit` vuelve a calcular líneas al cambiar su ancho, y la animación devuelta por `onSplit` conserva la limpieza y sincronización. `aria: auto` mantiene el nombre accesible de cada título. `gsap.matchMedia` limita los efectos al propio componente y los revierte cuando cambian las condiciones o se desmonta. Movimiento reducido, ventanas muy bajas y APIs no disponibles muestran la composición estática completa. El contenido no depende de hover.

La antigua lógica de la línea de tiempo se retiró de `assets/process-story.js`. `GradientCard` y su demo original siguen disponibles; no se usan en este nuevo proceso.

## Instalar y verificar

Con Node 22 o superior:

```bash
npm ci
npm run typecheck
npm run test:process
npm run build
```

GSAP está fijado en `package.json` y `package-lock.json`; no se carga desde un CDN. El build genera `dist/` para Vercel y preserva assets, páginas y rutas existentes. Tailwind importa tema/utilidades sin Preflight para conservar la base visual del home.

`test:process` ejecuta fixtures del controlador real compilado con dobles de GSAP: alcance local de triggers, zoom reversible, párrafos legibles, cambio de breakpoint y movimiento reducido, SSR, desmontaje antes de cargar fuentes y limpieza de títulos/triggers. La integración DOM adicional comprueba el HTML pre-renderizado, los cuatro bloques, IDs/ARIA, recursos y la hidratación.

Referencias: https://moyra.co/ · https://gsap.com/docs/v3/Plugins/ScrollTrigger/ · https://gsap.com/docs/v3/Plugins/SplitText/ · https://gsap.com/docs/v3/GSAP/gsap.matchMedia/
