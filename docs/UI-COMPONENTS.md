# Home y componentes

El home es estático: teléfono → servicios → proyectos → FAQ → contacto → footer. La sección «Cómo trabajamos» se retiró del contenido y de la navegación. Sus componentes React y sus recursos anteriores permanecen disponibles en el repositorio, pero el home ya no los importa ni hidrata.

## Rutas

- Reloj de animación compartido: `assets/scroll-story.js`.
- Teléfono/textos: `assets/shopify-hero.js`; escena WebGL: `tools/phone/runtime.mjs`.
- Galería: `assets/cases.js`; FAQ: `assets/faq-scroll.js`.
- Servicios, navegación, contacto y respuestas: sus controladores existentes en `assets/`.
- Componentes reutilizables shadcn: `components/ui/`; datos archivados del proceso: `components/process-cards.tsx`.
- TypeScript y alias `@/`: `tsconfig.json`. Tailwind: `styles/components.css`; `cn`: `lib/utils.ts`.

React, TypeScript y Tailwind están instalados. `components/ui` mantiene las importaciones de shadcn estables. No hace falta reiniciar la configuración. En otro proyecto, comenzar con `npx shadcn@latest init`; aquí se pueden añadir componentes mediante `npx shadcn@latest add <nombre>`. El home ya no solicita el bundle React/GSAP de proceso ni sus hojas CSS. El fondo continuo se conserva.

## Movimiento

`assets/chapter-arrivals.js` usa el mismo reloj para presentar títulos por líneas enmascaradas y acompañar los bloques con una subida corta. La entrada depende del scroll; una vez presentada, queda completa y sale con el documento, sin desvanecimiento de salida. Foco, movimiento reducido, ventanas bajas y ausencia de JavaScript mantienen el contenido legible. Las medidas compensan el desplazamiento visual propio para no mover los puntos de entrada al recalcular el layout. La pausa nativa de servicios es ahora de 0.24 veces la altura del viewport en escritorio (128–240px), y 0.16 en móvil (96–152px).

La auditoría y la cobertura de las diez FAQ están en `docs/HOME-UX-AUDIT.md`.

Teléfono, galería y FAQ usan un solo requestAnimationFrame bajo demanda. Los eventos de scroll se agrupan; la geometría se mide al inicializar o invalidar el layout, no en cada actualización de scroll. ResizeObserver, fuentes, resize y cambios de preferencias invalidan las medidas. El avance usa amortiguación temporal de 70ms, consistente a 60/120Hz. Las entradas/salidas de escenas y saltos largos se sincronizan con la posición nativa para liberar sticky en su punto correcto. No se interceptan rueda, touch ni teclado; no hay scroll virtual global.

Los textos del teléfono ocupan pantallas contiguas: el factor de lectura 1.32 controla el ritmo, sin dejar huecos de 32vh entre capítulos. El fallback CSS se mueve con transformaciones, no con left/top animados. El modelo WebGL recibe la pose y dibuja en ese mismo frame, evitando un RAF adicional de retraso. Las tres texturas se cargan y preparan antes de revelar el modelo; tamaños iguales no reinician el canvas. El render se limita a la escena visible y pausa con la pestaña oculta.

La galería calcula su recorrido con el ancho visible y conserva acceso nativo en móvil, movimiento reducido y pantallas bajas. Las flechas del teclado enfocan sin desplazar lateralmente el documento y sincronizan la tarjeta con el recorrido. El FAQ conserva mensajes, desvanecidos y respuestas; su desplazamiento se escribe solo en el track y la navegación por teclado revela preguntas recortadas. El scroll anchoring se desactiva únicamente en estas escenas móviles para evitar reajustes automáticos al cambiar el contenido.

## Compilación y verificación

```bash
npm ci
npm run build
```

El build ejecuta TypeScript y `scripts/verify-home-motion.mjs`, y copia el sitio a `dist/`. Las pruebas cubren agrupación de frames, reposo, amortiguación 60/120Hz, pausa/retorno de pestaña, movimiento reducido, saltos, limpieza, geometría en caché, galería/FAQ hacia delante/atrás, extremos, teclado y layout variable.

Para modificar el render 3D:

```bash
npm ci --prefix tools/phone
node tools/phone/build.mjs
node tools/phone/verify.mjs
```

La prueba del teléfono comprueba geometría, UVs, cambio de pantalla por detrás, 201 poses reversibles, móvil, accesibilidad estática y ausencia de lecturas de layout durante el scroll. Las verificaciones de controlador no certifican FPS ni sustituyen una revisión visual en navegador. El preview sigue protegido por el acceso de Vercel en la sesión del agente.

La portada incluye «Scroll ↓» en su esquina inferior derecha, elevado 96–140px desde la base de la escena para quedar visible desde el inicio. Sale hacia arriba con la primera pantalla. El ritmo vuelve a 404svh para el capítulo del teléfono, 1.32 alturas de escena por transición, factor 1.25 para la galería y 1.35 para el FAQ. La amortiguación compartida de 70ms y las optimizaciones de render se conservan. Los rótulos del menú y de la esquina superior recuperan la H mayúscula.

### Wheel pacing refinement
The shared scroll clock now eases the actual document position for vertical wheel/trackpad input: 0.68 travel multiplier, 110ms exponential time constant, one demand-driven RAF. Chapter consumers use the resulting position directly during wheel easing to avoid stacking two smoothing delays. Fractional internal position prevents stalls in browsers with rounded scroll coordinates; direction changes discard forward momentum. Touch momentum, keyboard, scrollbar dragging, zoom, form controls, scrollable nested content and reduced motion retain native behavior. Existing section lengths, typography, cue placement and layout are unchanged. Verified with simulated 60/120Hz input, reversal, boundaries, external scrolling, finite settling and rounded coordinates; browser visual/FPS verification remains unavailable in the protected preview.

### Entrance choreography and depth
Home entrances use a quintic ease-in-out curve: soft start, acceleration, soft landing. Phone turns retain their existing smoothstep curve and tested angular-speed limit. Heading lines have a 0.14 progress stagger; each section's following elements have 24px scroll offsets capped at 72px. These are scroll-linked offsets, not timers, so pausing and reversing remain predictable. Presented content stays visible. Desktop pinned project covers move up to 2.5% independently inside a 1.065 crop; hover zoom composes with this movement. Mobile/native galleries and reduced-motion mode omit cover parallax. Geometry is cached on layout invalidation; all movement uses the existing shared clock. Functional/controller/build checks passed; protected-preview visual QA remains unavailable.

## Casos reales: título de vapor y fondo

`case-studies/index.html` carga `assets/case-index.css`, el reloj compartido y el bundle `assets/case-index-motion.js` (bundle ligero sin runtime React). El fondo es procedural: negro #090909, neblina violeta apagada y ruido SVG, sin imágenes externas. Solo se aplica al índice de casos.

La referencia `VaporizeTextCycle` suministrada se adaptó en `lib/vapour-text.ts` a progreso 0–1 determinado por el scroll. La onda dispersa el título al salir hacia arriba y lo reconstruye al volver; no usa ciclos por tiempo ni física aleatoria por frame. La misma posición produce la misma imagen en ambos sentidos. El H1 HTML se conserva para lectores de pantalla, selección, impresión, fallos de canvas y movimiento reducido; el canvas es decorativo. Se conserva el tamaño editorial y el grid existente.

`components/ui/vapour-text-effect.tsx` ofrece el adaptador React reutilizable con `text`, `progress` y `tag`. React, TypeScript, Tailwind, shadcn y el alias @/ ya estaban configurados: componentes en `components/ui`, utilidad en `lib/utils.ts`, estilos Tailwind en `styles/components.css`; estilos públicos de esta página en `assets/case-index.css`. No se requieren nuevas dependencias ni configuración. El índice usa el mismo motor sin hidratar React. `scripts/build.ts` genera el bundle desde `src/case-index-motion.ts`.

`verify-case-vapour.ts` comprueba reversibilidad, posiciones finitas, reposo sin redibujos, geometría en caché, limpieza, fallback sin canvas y semántica del título. La revisión visual del preview protegido sigue pendiente en el navegador del usuario.


### Refinamiento editorial del índice
El título ocupa dos líneas y el texto introductorio se alinea a su derecha. Las cuatro portadas conservan su relación 5:4, con nombres fuera de la imagen y columnas escalonadas en escritorio; en móvil pasan a una sola columna. El CTA final comparte esa alineación editorial. La luz violeta se concentra detrás de las imágenes, el ruido baja de .09 a .023 y las sombras amplias separan las portadas del fondo. El scroll desplaza la luz hasta 42px y las imágenes hasta 2% dentro de un overscan de 6%; las tarjetas se presentan con una subida de hasta 28px y permanecen legibles al volver.

La dispersión aplica una máscara suave de 48px al HTML original y utiliza partículas circulares pequeñas; evita sustituir las letras por un bitmap durante el movimiento. La onda tiene easing y su recorrido se amplía, manteniendo reversibilidad. El controlador usa geometría en caché y el reloj existente; movimiento reducido limpia los offsets. Verificados build, TypeScript, pruebas de vapor y controlador de profundidad. La validación visual en el preview protegido continúa pendiente en el navegador del usuario.
