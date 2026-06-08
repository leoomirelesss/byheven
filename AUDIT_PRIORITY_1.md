# AUDIT_PRIORITY_1 — by ˈHevən

Fecha: 2026-06-08  
Alcance: Prioridad 1 — funcionamiento, navegación, enlaces, formulario, responsive, animaciones, accesibilidad básica y experiencia mobile. No incluye SEO avanzado, nuevas páginas ni campañas.

## Problemas encontrados

- En tablet/mobile los enlaces principales se ocultaban bajo `max-width: 1024px` sin un menú alternativo.
- Había enlaces internos muertos con `href="#"` que podían provocar errores al pasar por el listener global de anchors.
- LinkedIn no tenía URL real y estaba implementado como enlace roto en footer y redes.
- El formulario permitía enviar campos obligatorios vacíos y reemplazaba valores faltantes por “No especificado”.
- El copy del formulario sugería un contacto automático, aunque el flujo real disponible es WhatsApp prellenado.
- El scroll a anchors no compensaba el header fijo y podía dejar títulos debajo de la navegación.
- El loader de Spline se ocultaba por timeout sin un fallback visual robusto si el visor fallaba o tardaba.
- La intro y la secuencia de filosofía podían precargar recursos pesados demasiado pronto.
- Algunas animaciones JS continuas no respetaban completamente `prefers-reduced-motion`.
- Los nodos del timeline orbital y enlaces relacionados eran elementos no semánticos clickeables.
- Las redes sociales tenían labels accesibles incompletos.

## Cambios realizados

- Se agregó menú mobile/tablet accesible con botón hamburguesa, `aria-expanded`, `aria-controls`, cierre por enlace y cierre con Escape.
- Se cambió el logo para apuntar a `#inicio` y se robusteció el scroll interno contra anchors vacíos o selectores inválidos.
- Se eliminó “Nosotros” del footer al no existir sección real.
- LinkedIn quedó como elemento visual deshabilitado con `aria-disabled="true"` hasta contar con URL real.
- Se implementó validación real del formulario para nombre, WhatsApp, negocio, giro, necesidad, prioridad y mensaje.
- Se agregaron errores visibles por campo, estado global accesible y mensaje de éxito antes de abrir WhatsApp.
- Se alineó el copy del formulario con el flujo real: validar datos y enviar por WhatsApp prellenado.
- Se agregó compensación de header fijo con `scroll-padding-top`, `scroll-margin-top` y cálculo JS de offset.

- Se cambió el video de intro a `preload="metadata"` y se redujo el preload inicial de imágenes pesadas.
- La secuencia de filosofía inicia por `IntersectionObserver` cerca de la sección, no inmediatamente al cargar la página.
- El cursor personalizado y timeline orbital reducen/pausan movimiento cuando `prefers-reduced-motion` está activo.
- Los nodos orbitales y links relacionados ahora son botones reales con estados aria.
- Se agregaron `aria-label` a Instagram y WhatsApp del footer.

## Archivos modificados

- `index.html`
- `AUDIT_PRIORITY_1.md`

## Pruebas realizadas

- `node --check /tmp/byheven-inline.js` para validar sintaxis del JS embebido extraído desde `index.html`.
- Parse HTML básico con `html.parser` de Python.
- Revisión estática con `rg` para confirmar que no quedan `href="#"` activos.
- Revisión estática de assets enlazados directamente.
- Smoke test con `python3 -m http.server 4173` y `curl -I http://127.0.0.1:4173/index.html` devolviendo HTTP 200.
- Revisión de existencia de scripts: no hay `package.json`; no se ejecutó npm build/lint/test.

## Resolución de conflictos contra `main`

- Se revisaron `index.html` y `AUDIT_PRIORITY_1.md`; no quedaron marcadores `<<<<<<<`, `=======` ni `>>>>>>>`.
- Se conservaron los ajustes publicados de `main` para hero mobile, composición del robot, tarjetas/servicios/proyectos y logo loop mobile.
- Se conservaron los cambios del PR de Prioridad 1: menú mobile, anchors con offset, formulario validado, WhatsApp prellenado, fallback Spline, lazy loading de filosofía, reduced-motion y accesibilidad del footer/timeline.
- Se ajustó el fallback Spline para que el loader pueda ocultarse temprano sin marcar el viewer como fallido; si el viewer no resuelve tras el timeout real, entonces aparece el fallback.

## Corrección posterior — Hero 3D mobile

- Problema: el robot 3D dejó de aparecer en mobile porque la lógica de fallback removía el `<spline-viewer>` en `max-width: 767px` y dejaba el fallback como reemplazo permanente.
- Corrección: el visor Spline vuelve a cargarse en mobile; el fallback se mantiene solo para `prefers-reduced-motion`, error del viewer o timeout real de carga.
- Se retiró el `loading="lazy"` del custom element para evitar retrasos extra en el hero mobile.


## Corrección crítica — bloqueo de intro/carga inicial

- Problema: si el video de intro quedaba bloqueado por autoplay, red lenta o primer frame sin progreso, `body.intro-active` podía mantener el sitio sin scroll esperando el evento `ended`.
- Corrección: la intro ahora arranca silenciada para maximizar compatibilidad de autoplay, libera el sitio ante error/stall/sin progreso y tiene un timeout máximo de seguridad.
- Resultado: ningún asset pesado de intro puede dejar el sitio congelado; el usuario puede seguir navegando aunque el video falle.


## Hotfix crítico — intro no bloqueante por defecto

- Problema adicional: la intro se renderizaba activa desde el HTML/CSS inicial (`body.intro-active` + overlay visible). Si cualquier asset, autoplay o JS fallaba antes de cerrar la intro, el sitio podía quedar visualmente congelado y sin scroll.
- Corrección: la intro queda oculta/no bloqueante por defecto y JS la activa solo cuando el controlador está listo; además conserva guardas por error, stall, rechazo de autoplay y timeout máximo.
- Carga local validada: el sitio responde HTTP 200 servido como estático y el HTML/JS embebido no presenta errores de sintaxis.


## Estado de resolución de conflictos del PR

- Se verificó nuevamente `index.html` y `AUDIT_PRIORITY_1.md` en el branch actual: no hay marcadores de conflicto reales.
- La versión conservada mantiene el hero mobile publicado de `main` con el robot Spline visible y la composición responsive existente.
- También conserva los cambios del PR: menú mobile accesible, anchors con offset, validación del formulario, WhatsApp prellenado, fallback Spline bajo fallo/timeout, `prefers-reduced-motion`, LinkedIn deshabilitado y botones orbitales accesibles.
- Nota operativa: desde este entorno no fue posible traer `main` ni empujar al remoto por bloqueo de red/túnel; el contenido local queda listo y validado para empujarse desde un entorno con acceso.

## Pendientes que requieren decisión del dueño

- Confirmar URL real de LinkedIn para activar el enlace.
- Confirmar si el Instagram actual es el definitivo de by ˈHevən.
- Definir backend real o servicio transaccional si se quiere envío sin depender de WhatsApp.
- Optimizar/reexportar videos de intro y secuencias de filosofía; no se borraron assets por instrucción explícita.
- Hacer QA visual con navegador real en dispositivos físicos antes de campañas.

## Notas de performance futura

- Los videos de intro y secuencias de frames siguen siendo pesados; se redujo su impacto inicial sin eliminarlos.
- Para Prioridad 2 conviene evaluar formatos web optimizados (`webm/mp4`), reducción de frames o reemplazo por video/sprites según calidad visual requerida.

## Confirmación de alcance

- No se hizo SEO avanzado.
- No se crearon páginas nuevas.
- No se agregaron dependencias.
- No se inventó backend ni integración falsa.
