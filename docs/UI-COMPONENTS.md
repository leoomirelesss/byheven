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
