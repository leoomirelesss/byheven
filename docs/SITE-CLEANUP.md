# Limpieza del sitio anterior

Base: `a082cf3fd2be3dc62d1685f3ca8689a5f717ae28`, rama de preview `codex/shopify-home-stage-1`.

Se retiraron 1,431 archivos (1,936,744,600 bytes del árbol de fuentes): secuencias antiguas, videos, capturas anteriores, recursos de paquetes/proceso/logos/cursor, la landing anterior y código de la sección de proceso eliminada. El historial de Git conserva las versiones previas; esta limpieza no reduce el historial existente.

El CSS embebido del home pasó de 90,240 a 13,486 bytes. Se retiraron 568 ramas de selectores sin clases presentes en el contenido actual ni en sus controladores. Una comparación estática comprobó declaraciones y especificidad aplicables a todos los nodos y pseudoelementos en estados inicial, menú, footer, teléfono y tema claro, comparando las condiciones de media por separado. El HTML fuera de ese bloque de estilo permanece idéntico.

Se conserva el modelo 3D, texturas y pantallas vigentes, fallbacks, controladores de scroll, accesibilidad y componentes reutilizables. Se retiró la dependencia GSAP junto con el proceso que la utilizaba y el controlador alterno de menú que ya no se ejecutaba en las páginas actuales.

La compilación publica explícitamente `index.html`, `assets/`, `case-studies/`, `robots.txt` y `sitemap.xml`. La página de revisión `phone-model.html` sigue disponible en el repositorio para desarrollo y no se publica. La ruta retirada `/diseno-web-torreon/`, con o sin barra final, redirige a `/case-studies/`.

`scripts/verify-public-site.mjs` comprueba el resultado real de cada build: ocho páginas, recursos locales y srcset, anchors, imports, recursos dinámicos conocidos del teléfono y ausencia de páginas/medios retirados. Antes del despliegue se comprobó el árbol de recursos retenidos y se ensayaron fallos de textura ausente, página de desarrollo filtrada y anchor roto.

No se borraron datos del navegador ni se cambiaron las políticas de caché HTTP. La limpieza no equivale a una medición de FPS o a una nueva revisión visual en Safari/Chrome físicos.
