# Cierre de UX y contenido del home

Recorrido: Shopify → servicios → proyectos → FAQ → contacto. Se conserva la composición aprobada y el fondo continuo. Los rótulos de sección, sus contadores y las líneas que separaban los bloques se retiraron; permanecen los títulos que explican el contenido y los controles del formulario/acordeones.

## Cobertura de la decisión del cliente

| Necesidad | Dónde se resuelve |
| --- | --- |
| Entender la oferta principal | Portada: administración de Shopify, catálogo, promociones y pedidos |
| Distinguir servicio mensual y proyecto | Modalidades de servicios y FAQ de cotización |
| Conocer el alcance | Tres servicios con tareas incluidas; contenido con IA identificado como complemento |
| Ver trabajos | EMYASA, Stone Küchë, Parsömen y D’OR; acceso a todos los casos |
| Trabajar sobre una tienda existente o crear una nueva | FAQ de tienda actual y tienda desde cero |
| Saber cómo comenzar y cuánto tarda | FAQ de inicio, materiales, accesos y calendario acordado |
| Entender cómo se revisa y se da seguimiento | FAQ de avances y soporte posterior |
| Distinguir honorarios y herramientas externas | FAQ de cotización y costos de Shopify, apps y dominio |
| Contactar con claridad | WhatsApp, correo, ubicación y formulario que prepara un mensaje en WhatsApp |

## Selección de FAQ

De doce a diez, sin añadir preguntas a la sección. Se retiraron la de contenido con IA (ya se explica como complemento) y la de páginas fuera de Shopify (ya se muestran sitios y landing pages en servicios). La pregunta genérica de automatización se sustituyó por «¿Cómo revisamos los avances?», recuperando el seguimiento útil del proceso retirado. Las otras nueve preguntas conservan sus respuestas. No se inventan precios, plazos fijos, resultados ni condiciones comerciales.

La portada distingue ahora operación diaria y reportes para decidir, evitando repetir el mismo beneficio en las tres pantallas. Se retiraron frases genéricas del portafolio, etiquetas de modalidad repetidas y contadores que no ayudaban a decidir. El cuerpo visible pasa de 841 a 683 palabras, contando también las copias decorativas de los títulos de acordeón.

## Comportamiento

- Títulos con entrada ascendente por líneas. Los bloques acompañan la entrada con 32px de recorrido máximo; después quedan presentados y salen mediante el scroll normal, sin otro efecto de salida.
- Un solo reloj bajo demanda y geometría en caché. El nuevo comportamiento no captura rueda, touch o teclado ni añade fijaciones de pantalla.
- Pausa de lectura de servicios: en un viewport de 900px, 216px en escritorio frente a 162px anteriores; en móvil, 144px frente a 108px. El contenido abierto y el tamaño de pantalla recalculan el espacio.
- Accesibilidad: títulos con nombre completo, IDs/ARIA coherentes, foco visible y contenido completo con movimiento reducido, pantallas bajas o JavaScript desactivado.

## Verificación y límite

Build y TypeScript; controladores de scroll compartido, galería y FAQ; entrada progresiva y persistencia después de presentarse; ausencia de desvanecimiento de salida; foco; preferencias de movimiento; disparadores estables al recalcular medidas; pausa responsive; expansión de servicios; diez FAQ; IDs y destinos internos verificados. Las tarjetas, enlaces, formulario y respuestas conservan su funcionamiento existente.

La verificación de controladores no certifica FPS ni lectura visual en todos los tamaños. La sesión disponible del navegador requiere acceso a Vercel. Las páginas individuales de servicios y casos siguen siendo un trabajo posterior, fuera de este cierre del home.
