# Identidad visual · Andrea y Alberto

Actualización: 8 de noviembre de 2026. Estética de papelería artesanal: papel de algodón, fotografía monocroma con marco, lazo de lino, flores secas y enlaces manuscritos. La invitación, los detalles, la confirmación, el regalo opcional y el álbum comparten colores y controles.

- Papel: `#f7f5ef`; tinta: `#565149`; detalle cálido: `#8b7660`; texto secundario: `#686358`.
- Verde oliva: `#465640`; oliva profundo: `#34432f`; salvia suave: `#e5e9de`. El oliva destaca acciones, estados elegidos, nombres y la tarjeta de cuenta atrás. El sello real conserva su rojo original.
- Cormorant para titulares y textos de invitación, Parisienne para notas manuscritas, DM para controles y lectura funcional.
- `app/natural.css` contiene la composición actual. Se carga después de los estilos estructurales y de los controles existentes.
- La apertura conserva el sello real facilitado por Jose. El monograma usa la geometría del SVG original, con color adaptado mediante CSS.
- La primera fotografía de Historia, si está configurada en el panel, sustituye la foto provisional de portada. El fallback es `public/assets/andrea-alberto-portrait.webp`.
- No se han inventado lugares, horarios definitivos, historia de la pareja, fecha límite ni datos bancarios.

## Recursos y procedencia

Los tres adornos se generaron para este proyecto con la herramienta de generación de imágenes integrada. No se han extraído de la plantilla de referencia ni se ha utilizado la cuenta de Magnific. Se han optimizado como WebP conservando la transparencia en el lazo y las flores.

| Archivo del repositorio | Uso | Tamaño |
| --- | --- | --- |
| `public/assets/linen-bow.webp` | Lazo en el margen de la portada | 103.370 bytes |
| `public/assets/dried-chamomile.webp` | Flores de portada y detalles | 40.082 bytes |
| `public/assets/cotton-paper.webp` | Textura de papel | 22.042 bytes |
| `public/assets/andrea-alberto-portrait.webp` | Foto provisional facilitada por el usuario | 133.572 bytes |

La fotografía WebP se codifica **sin pérdida**, conservando todos los píxeles visibles y el alfa del PNG original (340.738 bytes). No se ha regenerado ni retocado a la pareja. El archivo PNG original se conserva. Las fuentes locales existentes se entregan en WOFF; se conservan también los TTF.

## Prompts finales de los adornos

### Lazo

Use case: product-mockup. Create a photorealistic isolated decorative asset for a fine-art wedding stationery website: one natural thin beige linen twine tied in a loose imperfect elegant bow, with two long gently curving hanging tails and the twine continuing straight vertically through the knot toward top and bottom. Straight overhead flat lay, no perspective. Beautiful real frayed linen fibres, pale warm taupe, delicate understated minimal wedding aesthetic. Entire bow and long tails visible, generous padding. Transparent background with genuine alpha, no paper, no text, no frames, no other objects, no watermark. Vertical composition.

### Flores

Use case: product-mockup. Website decorative asset: a delicate small botanical specimen consisting of three real dried chamomile flowers with thin imperfect beige stems, muted tiny ochre yellow centres and faded pale ivory petals, one small dried sage leaf. Stems gathered very loosely, long and slender, seen directly overhead as in a fine art herbarium photograph. Minimal natural wedding stationery aesthetic. Photorealistic, visible paper-dry petals, diffuse daylight, soft detail, no harsh contrast. Isolated on genuine transparent background, generous padding around the whole specimen. No vase, no bow, no text, no watermark, no frame, no paper. Vertical composition.

### Papel

Use case: photorealistic-natural. Asset type: subtle full-bleed background texture for a minimalist wedding stationery website. Entire image is a close overhead scan of blank natural handmade cotton rag paper, very pale warm off white, barely visible irregular long cotton fibres, subtle soft grain, understated tonal variation, premium fine-art paper. Completely flat uniform diffuse daylight from above. No objects, no writing, no patterns, no folds, no borders, no edges, no shadows, no vignetting, no yellowing, no grey stains. Very light warm ivory nearly white #f6f4ef. Texture must remain low contrast so dark text is highly readable. Portrait sheet.

## Movimiento y accesibilidad

Paralaje suave en foto, lazo y flores, con actualizaciones agrupadas en requestAnimationFrame. Aparición de las secciones al entrar en pantalla. La cuenta atrás se actualiza dentro de su propio componente, sin renderizar toda la portada cada segundo. Las decoraciones tienen texto alternativo vacío y no interceptan clics. Se reserva espacio para las imágenes. La preferencia de movimiento reducido desactiva el paralaje y las transiciones.

## Comprobación

TypeScript, 73 pruebas existentes y compilación de producción correctos. Revisión del despliegue real en escritorio y viewport móvil de 390 × 844: sobre, portada, detalles, confirmación, álbum y diálogos de compartir/subir. Sin cambios en respuestas existentes. No se ha vuelto a subir un archivo real en esta pasada visual. La revisión en dispositivos físicos sigue pendiente.

## Contraste y legibilidad

Segunda pasada: oliva profundo en acciones y selección, tarjeta de fecha en verde con texto claro, tipografía secundaria móvil ampliada, estados de foco y carga coherentes, tarjeta de confirmación y regalo con borde de tinta verde. La cuenta atrás incluye acceso a los detalles del día. No se modifican respuestas ni archivos compartidos.

## Movimiento y recuperación · 9 de noviembre de 2026

- Entrada escalonada de fotografía, etiqueta y enlaces; aparición de los momentos del día al desplazarse. No se oculta información si el observador de visibilidad no está disponible.
- La preferencia de movimiento reducido se escucha también si cambia con la página abierta. La cuenta atrás pausa su temporizador cuando la pestaña está oculta.
- Si la foto configurada no carga, se intenta la foto provisional; si tampoco está disponible, se muestra el monograma.
- Si una lectura de configuración falla después de autenticar un enlace personal, se conserva la sesión y se reintenta la lectura. Un fallo de conexión no se presenta como un enlace inválido. Los clics simultáneos de reintento comparten una sola operación.
- Los QR tienen recuperación visible y protección frente a resultados de otra solicitud anterior; no se ofrece descargar un QR vacío.
- Aviso del navegador cuando pierde la conexión y pantalla de recuperación para errores de renderizado. No se reenvían respuestas ni archivos automáticamente.
- 80 pruebas automáticas y compilación local correctas. Flujo de GitHub Actions añadido para comprobar tipos, pruebas y compilación en cada push a main o pull request; es una comprobación independiente del despliegue automático de Vercel.

Estas medidas reducen fallos y facilitan recuperarse; no garantizan disponibilidad de red o de proveedores externos ni sustituyen las pruebas en dispositivos físicos.

La primera ejecución de GitHub Actions terminó correctamente (run 42597162645). También se verificaron en producción la apertura de la invitación, el rechazo claro de un enlace inválido y la generación del QR común. La revisión a 320 px detectó que la última acción de la cabecera podía quedar fuera del área visible; se corrigieron sus márgenes y espacios para mantenerla accesible.
