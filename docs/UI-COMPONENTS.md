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

`case-studies/index.html` carga `assets/case-index.css`, el reloj compartido y el bundle `assets/case-index-motion.js` (bundle ligero sin runtime React). El fondo es procedural: Velvet Haze estático en negro y violeta apagado, con fallback CSS/SVG y sin imágenes externas. Solo se aplica al índice de casos.

La referencia `VaporizeTextCycle` suministrada se adaptó en `lib/vapour-text.ts` a progreso 0–1 determinado por el scroll. La onda dispersa el título al salir hacia arriba y lo reconstruye al volver; no usa ciclos por tiempo ni física aleatoria por frame. La misma posición produce la misma imagen en ambos sentidos. El H1 HTML se conserva para lectores de pantalla, selección, impresión, fallos de canvas y movimiento reducido; el canvas es decorativo. Se conserva el tamaño editorial y el grid existente.

`components/ui/vapour-text-effect.tsx` ofrece el adaptador React reutilizable con `text`, `progress` y `tag`. React, TypeScript, Tailwind, shadcn y el alias @/ ya estaban configurados: componentes en `components/ui`, utilidad en `lib/utils.ts`, estilos Tailwind en `styles/components.css`; estilos públicos de esta página en `assets/case-index.css`. No se requieren nuevas dependencias ni configuración. El índice usa el mismo motor sin hidratar React. `scripts/build.ts` genera el bundle desde `src/case-index-motion.ts`.

`verify-case-vapour.ts` comprueba reversibilidad, posiciones finitas, reposo sin redibujos, geometría en caché, limpieza, fallback sin canvas y semántica del título. La revisión visual del preview protegido sigue pendiente en el navegador del usuario.


### Distribución restaurada y Velvet Haze estático
Se restauró exactamente el markup de la distribución anterior al cambio editorial (referencia 92b0d326), salvo los wrappers decorativos del título y el canvas del fondo: título en una línea, dos columnas alineadas, nombres sobre las portadas y espaciados originales. `assets/case-index.css` ya no altera grids, márgenes, captions o proporciones. Se retiraron los movimientos de tarjetas, fotografías y fondo añadidos en la revisión editorial.

El fondo adapta el shader Velvet Haze suministrado en `lib/velvet-haze.ts`: pliegue de luz, sombra curva, luz violeta #49358d, negros #090909/#07060a y reflejo lavanda apagado. Tiempo, grano y dominio están congelados. No hay seguimiento de mouse, ondas al hacer clic, RAF, timers ni parallax. WebGL dibuja una vez y solo repinta si cambia el tamaño; resolución limitada a DPR 1.25, contexto low-power. CSS conserva un fallback estático si WebGL falla. `components/ui/velvet-haze.tsx` ofrece la adaptación React reutilizable.

El título conserva la máscara suave sobre letras HTML y partículas finas reversibles por scroll. Verificados la igualdad de distribución con la versión anterior, build/TypeScript, reversibilidad del título, ausencia de entradas de movimiento en el fondo, dibujo único, resize, fallback y limpieza de recursos. La compilación real del shader y la revisión visual en el preview protegido permanecen pendientes en el navegador del usuario.


### Movimiento sobre el acomodo aprobado
`lib/case-choreography.ts` añade curvas quintic ease-in-out al presentar las tarjetas y el CTA, con un offset de scroll de 44px para la segunda tarjeta de cada fila y una entrada posterior de los captions. Las subidas son de hasta 26px y llegan a su posición original; el markup, las columnas, las proporciones, los márgenes y la posición de los textos no cambian. El título de vapor también usa quintic ease-in-out.

El parallax se limita a las imágenes: hasta 2% en escritorio, 1.3% en móvil, dentro de una ampliación de 6% para cubrir los bordes. El shader Velvet Haze conserva una exposición fija y sigue sin responder al mouse ni al scroll. Todo el movimiento usa el reloj compartido bajo demanda, geometría en caché y respeto de foco/movimiento reducido. Se verificaron easing, orden de entrada, captions, límites de parallax, estabilidad del trigger al medir, foco, limpieza y preservación del layout.


### Cierre minimalista y footer compartido visualmente
Se retiraron las etiquetas «(SIGUIENTE PROYECTO)» y «(04 proyectos)» del índice. El cierre mantiene una invitación breve a WhatsApp; el home conserva el formulario completo. El índice incorpora el markup del footer claro del home y sus enlaces, con anchors absolutos /#work, /#services y /#contact. `assets/site-footer.css` reutiliza las reglas base del footer; `home-finish.css/js` aportan vidrio de redes, reveal, ocultación del dock y control de menú. `data-home-navigation` evita registrar el controlador de menú alterno de cases.js en esta página. Se eliminó el padding inferior del body para que el footer cierre la página sin franja oscura.

La base del fondo del índice cambia solamente a violeta casi negro #0C0912 y la sombra a #08060D, manteniendo pliegues, luces, grano, exposición fija y composición. El título «Tu negocio. Nuestro siguiente proyecto.» del home baja a clamp(45px, 5.8vw, 108px) y a clamp(38px, 10.2vw, 66px) en móvil, acorde con los otros h2 del home.

Verificados build/TypeScript, igualdad del markup del footer con el home, enlaces entre páginas, un solo controlador de menú, visibilidad del dock, aislamiento del menú, foco con Escape y reveal del footer. La comprobación visual del preview sigue pendiente en el navegador del usuario.
