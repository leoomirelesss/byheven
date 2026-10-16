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
npm run build
```

`dist/` es la salida estática que publica Vercel. El build conserva `assets`, `case-studies`, `diseno-web-torreon`, los documentos HTML y los archivos públicos de la raíz. No publica dependencias ni código de desarrollo.

React, React DOM, Framer Motion, Lucide, CVA, clsx y tailwind-merge están instalados y fijados en `package-lock.json`. TypeScript y Tailwind CLI son dependencias de desarrollo. La configuración manual de shadcn ya está creada; no hace falta ejecutar `init` sobre este sitio.

Para crear un proyecto React nuevo con shadcn desde cero, la alternativa oficial es `npx shadcn@latest init` y elegir un proyecto React/TypeScript. Para añadir después componentes a este repositorio, usar `npx shadcn@latest add <nombre>` y revisar los cambios de CSS antes de compilar. No es necesario para las tarjetas integradas.

Tailwind importa el tema y las utilidades sin Preflight para conservar el reset, las fuentes y el aspecto del home existente. Solo se escanean `components/` para generar utilidades. La tarjeta mantiene las cuatro variantes de color del ejemplo y sus enlaces opcionales; el proceso del home usa una sola familia lavanda y no añade botones repetidos entre etapas.

Referencias oficiales: https://ui.shadcn.com/docs/installation/manual · https://ui.shadcn.com/docs/components-json · https://tailwindcss.com/docs/preflight
