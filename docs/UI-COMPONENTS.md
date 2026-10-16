# Hitos editoriales de proceso

El sitio conserva su HTML, sus rutas y los controladores existentes. Solo los cuatro hitos de «Cómo trabajamos» se renderizan como una isla React. El build incluye su HTML antes de cargar JavaScript; después se hidrata la misma estructura y arranca la línea de tiempo.

## Rutas

- Tarjeta genérica reutilizable: `components/ui/gradient-card.tsx` (se conserva para la demo; el home usa artículos editoriales simples).
- Demo con enlaces: `components/ui/demo.tsx`.
- Datos y artículos del home: `components/process-cards.tsx`.
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

La línea de tiempo usa una S vertical en el flujo normal de la página. El plano mide 3 pantallas (mínimo 1700 px), con un giro horizontal más contenido y cuatro paradas alternadas. Encabezado, curva y textos suben con el mismo scroll nativo, sin una ventana sticky ni una cámara artificial.

El home renderiza artículos semánticos con número, título, descripción e icono decorativo. No tienen recuadro, borde, relleno, sombra, escala ni animación de hover. Los iconos miden 88 px en escritorio, 44 px en tablet/móvil y 36 px en pantallas pequeñas; el texto dispone de su propia columna o fila. `GradientCard` y su demo siguen disponibles como componentes independientes.

La bolita arranca en el origen con cero trazo iluminado. Cuando se acerca a una parada, su texto aparece suavemente con opacidad y un desplazamiento máximo de 12 px. Después permanece en la página y sale por arriba con el scroll: no vuelve a cerrarse ni encogerse. Al subir, el progreso y las apariciones se revierten. La línea pendiente es tenue; el brillo activo y el trazo blanco comparten el recorte vertical. El SVG cabe dentro de su viewBox y sus extremos se atenúan hacia las secciones vecinas.

La posición de cada artículo se calcula con la envolvente de la curva sobre toda su altura para conservar espacio alrededor del contenido. El ancho se ajusta al área disponible. Los cuatro artículos permanecen accesibles para lectores de pantalla incluso antes de aparecer visualmente; no dependen de un resumen duplicado, `aria-hidden` o `inert`. En movimiento reducido, ventanas de menos de 600 px de alto o sin APIs necesarias, se presentan estáticos. `test:process` comprueba el origen sin luz, aparición gradual y persistente, legibilidad semántica, límites SVG, separación, scroll inverso, salida y limpieza del controlador.

React, React DOM, Framer Motion, Lucide, CVA, clsx y tailwind-merge están instalados y fijados en `package-lock.json`. TypeScript y Tailwind CLI son dependencias de desarrollo. La configuración manual de shadcn ya está creada; no hace falta ejecutar `init` sobre este sitio.

Para crear un proyecto React nuevo con shadcn desde cero, la alternativa oficial es `npx shadcn@latest init` y elegir un proyecto React/TypeScript. Para añadir después componentes a este repositorio, usar `npx shadcn@latest add <nombre>` y revisar los cambios de CSS antes de compilar. No es necesario para las tarjetas integradas.

Tailwind importa el tema y las utilidades sin Preflight para conservar el reset, las fuentes y el aspecto del home existente. Solo se escanean `components/` para generar utilidades. La tarjeta mantiene las cuatro variantes de color del ejemplo y sus enlaces opcionales; el home usa hitos sin superficie y un trazo violeta tenue con progreso blanco, sin botones repetidos entre etapas.

Referencias oficiales: https://ui.shadcn.com/docs/installation/manual · https://ui.shadcn.com/docs/components-json · https://tailwindcss.com/docs/preflight
