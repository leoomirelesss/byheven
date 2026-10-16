# Tarjetas de proceso

El sitio conserva su HTML, sus rutas y los controladores existentes. Solo las cuatro tarjetas de «Cómo trabajamos» se renderizan como una isla React. El build incluye su HTML antes de cargar JavaScript; después se hidrata la misma estructura y arranca la línea de tiempo.

## Rutas

- Componente reutilizable: `components/ui/gradient-card.tsx`.
- Demo con enlaces: `components/ui/demo.tsx`.
- Datos y tarjetas del home: `components/process-cards.tsx`.
- Entrada de cliente: `src/process-cards.tsx`.
- Tailwind y variables del componente: `styles/components.css`.
- Adaptación visual y geometría del home: `assets/process-story.css`.
- Controlador de scroll: `assets/process-story.js`.
- Utilidad `cn`: `lib/utils.ts`.

Se creó `components/ui` porque el repositorio original no tenía una carpeta de componentes. Es el destino configurado para los componentes de shadcn y mantiene estables las importaciones `@/components/ui/...`. `components.json` y `tsconfig.json` usan el mismo alias `@/` hacia la raíz del proyecto.

## Instalar y compilar

Con Node 22 o superior, desde la raíz del repositorio:

```bash
npm ci
npm run typecheck
npm run test:process
npm run build
```

`dist/` es la salida estática que publica Vercel. El build conserva `assets`, `case-studies`, `diseno-web-torreon`, los documentos HTML y los archivos públicos de la raíz. No publica dependencias ni código de desarrollo.

La línea de tiempo usa una curva SVG continua. La bolita y las cuatro etapas se colocan con la geometría real del trazo; cada tarjeta queda conectada a su punto mediante una guía vertical. El alto real de todas las tarjetas y su distancia a la curva determinan si cabe el recorrido. En ventanas de hasta 760 px de alto, compacta el encabezado y el espacio vertical. En movimiento reducido, ventanas muy bajas o sin la mejora de scroll, conserva una línea con sus cuatro etapas sobre las tarjetas estáticas. `test:process` comprueba los casos de altura, scroll de ida y vuelta y limpieza del controlador; también se ejecuta durante el build.

React, React DOM, Framer Motion, Lucide, CVA, clsx y tailwind-merge están instalados y fijados en `package-lock.json`. TypeScript y Tailwind CLI son dependencias de desarrollo. La configuración manual de shadcn ya está creada; no hace falta ejecutar `init` sobre este sitio.

Para crear un proyecto React nuevo con shadcn desde cero, la alternativa oficial es `npx shadcn@latest init` y elegir un proyecto React/TypeScript. Para añadir después componentes a este repositorio, usar `npx shadcn@latest add <nombre>` y revisar los cambios de CSS antes de compilar. No es necesario para las tarjetas integradas.

Tailwind importa el tema y las utilidades sin Preflight para conservar el reset, las fuentes y el aspecto del home existente. Solo se escanean `components/` para generar utilidades. La tarjeta mantiene las cuatro variantes de color del ejemplo y sus enlaces opcionales; el proceso del home usa superficies oscuras ligeras y un trazo violeta con progreso blanco y no añade botones repetidos entre etapas.

Referencias oficiales: https://ui.shadcn.com/docs/installation/manual · https://ui.shadcn.com/docs/components-json · https://tailwindcss.com/docs/preflight
