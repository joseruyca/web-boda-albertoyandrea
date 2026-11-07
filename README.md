# Andrea + Alberto · 16 de septiembre de 2027

Versión 3 del proyecto: Next.js para Vercel, Postgres y Storage privados en Supabase. Incluye la fotografía provisional real facilitada por el usuario. La publicación anterior de Sites es un prototipo distinto; este proyecto no depende de Cloudflare, D1, R2 ni de un inicio de sesión con ChatGPT.

## Experiencia

Invitación en marfil y burdeos, nombres caligráficos, ilustraciones vectoriales originales, cuenta atrás y fotografía auténtica. Navegación por escenas, adaptación móvil y reducción de movimiento accesible. La confirmación y la mesa se abren con la invitación personal. La galería admite fotos y vídeos con subida directa firmada, progreso y reintentos.

## Invitaciones sin crear cuentas

Se crea una invitación por persona, pareja o familia. Se añaden los nombres autorizados y, opcionalmente, un teléfono. El servidor genera un enlace aleatorio. Los enlaces se conservan cifrados para poder copiarlos después; la identificación se comprueba mediante su hash. El teléfono solo sirve para preparar el enlace de WhatsApp: no se utiliza para identificar automáticamente a nadie.

El panel permite importar hasta 300 invitaciones por tanda, recuperar enlaces, preparar el texto de WhatsApp, descargar QR individuales y marcar manualmente qué se ha enviado. «Enlace abierto» indica que el enlace se usó en la web; no es una confirmación de lectura de WhatsApp. El envío del mensaje lo realiza la persona que abre WhatsApp. Reenviar una invitación permite a su destinatario utilizarla, por lo que debe compartirse solo con esa familia.

CSV de importación, con nombres separados por `|`:

```csv
invitacion;personas;telefono
Ana y Luis;Ana García|Luis Pérez;+34612345678
Familia López;María López|Pedro López|
```

El QR común apunta a `/#gallery`. Cualquier visitante puede ver, subir y descargar los originales del álbum sin cuenta ni invitación. Cada archivo aparece al finalizar y validar la subida; los novios pueden retirarlo desde el panel. Los nombres indicados al subir no están verificados. El QR no permite confirmar asistencia, consultar mesas personales ni acceder al titular o al IBAN. Las reservas de subida se aíslan por invitación o por navegador, sin restringir la lectura de los archivos terminados.

## Backend

- Nuevo proyecto Supabase: `rxnzbrgkqmujpyvlvsum`, organización elegida por el usuario, región UE.
- RLS habilitado y sin acceso directo a las tablas para `anon` y `authenticated`.
- Una Edge Function autenticada por el backend de Vercel aplica las autorizaciones. Las claves privilegiadas de Supabase se leen únicamente dentro de esa función; no se exportan al navegador ni a Vercel.
- Vercel mantiene cookies HttpOnly y la clave de organización. Los enlaces se cifran con AES-256-GCM.
- Los archivos viajan directamente a Storage, mediante una autorización limitada a un objeto. La API de Vercel nunca recibe el contenido del vídeo.
- Límite inicial: 50 MB por archivo y 1 GB / 200 archivos por invitación o navegador del QR. El bucket también aplica el límite de 50 MB.
- La finalización comprueba existencia y tamaño del archivo antes de compartirlo automáticamente.

## Estado de esta entrega

Compilación de producción y TypeScript comprobados. Cuarenta y tres pruebas automáticas cubren importación, mensajes, cifrado, autenticación del backend, invitados autorizados, publicación de mesas, álbum compartido, separación de datos privados y revocación. Las pruebas automáticas de backend usan una base simulada. Además, el 7 de noviembre de 2026 se verificaron contra Supabase real la apertura de una invitación, el guardado de asistencia, la subida firmada de una imagen, su aparición en el álbum y la descarga exacta del original. Los datos y el archivo de prueba se retiraron al terminar.

Supabase tiene las tablas, el bucket privado y la Edge Function wedding-api desplegados. Las cuatro variables privadas del servidor están configuradas en producción en Vercel. La conexión pública completa se ha verificado el 7 de noviembre de 2026. Vercel publica automáticamente desde GitHub. La conexión de Vercel tiene acceso autorizado al equipo y el despliegue de producción usa Supabase real.

Faltan lugar y dirección, horarios definitivos, fecha límite de confirmación, lista de invitados y futura fotografía de portada. Los horarios de partida están marcados como provisionales. No se ha inventado una fecha límite para confirmar.

## Puesta en marcha

Node >=22.13. Primero enlazar el repositorio con el proyecto de Vercel correcto. Después configurar sus variables y verificar las claves antes de ejecutar migraciones o desarrollo.

```sh
npm ci
# Solo para preparar el primer despliegue; no sobrescribe secretos locales existentes:
node scripts/prepare-deployment.mjs
npm run typecheck
npm test
npm run build
```

Variables exclusivamente del servidor: `WEDDING_API_URL`, `WEDDING_BACKEND_SECRET`, `ADMIN_KEY` e `INVITATION_ENCRYPTION_KEY`. Los secretos se generan en `.env.local`, que está ignorado y no se incluye en esta entrega. No deben ponerse bajo el prefijo `NEXT_PUBLIC_` ni compartirse con invitados. En proyectos ya desplegados, conservar la clave de cifrado de producción para poder recuperar sus enlaces.

Con la vinculación y las variables verificadas, aplicar `supabase/schema.sql` como migración, desplegar `supabase/functions/wedding-api/` con `verify_jwt=false` (su propio control autentica al backend), y desplegar el proyecto Next.js a Vercel. Comprobar el recorrido completo contra los servicios reales antes de repartir invitaciones.

## Previsualización personal

El código de prueba de Jose se verifica mediante hash en el servidor y abre una sesión separada, sin acceso a datos reales. Las respuestas y archivos de esa vista solo se simulan en el navegador. El QR de prueba abre la galería de esa misma previsualización. El código no se incluye en el repositorio. Sin configurar el backend, la portada y la previsualización siguen disponibles, pero las operaciones reales permanecen desactivadas.

## Entrada del sobre

La invitación comienza con un sobre en relieve, sello interactivo y apertura de la tarjeta. El recorrido interior añade profundidad al desplazarse, apariciones por sección y una composición editorial de nombres y fotografía. El sobre se muestra una vez por sesión y puede repetirse desde «El sobre». Los accesos directos al álbum mediante QR omiten la apertura. Se respeta la preferencia de movimiento reducido del dispositivo y todos los controles funcionan con teclado.

## Regalo opcional

La sección puede activarse desde los ajustes de los novios, con titular e IBAN. Se valida el checksum del IBAN; esto no verifica el titular ni la existencia de la cuenta. Los datos bancarios no se incluyen en la configuración enviada a visitas generales del álbum. No hay pasarela de pago ni seguimiento de transferencias. No se ha añadido ninguna cuenta bancaria real.

## Recorrido completo

- El sobre usa el nombre de la invitación y descubre la tarjeta mediante una transición continua.
- Portada en tres etapas: antes, durante y después. El modo automático sigue la fecha en Europe/Madrid; los novios también pueden elegir la etapa manualmente.
- Historia editable, con hasta 12 fotografías y textos propios. Se pueden seleccionar fotos del álbum o usar una URL HTTPS/ruta local. No se publican historias vacías ni se han inventado anécdotas.
- Información editable de autobuses, alojamiento, vestimenta, contacto y hasta 15 preguntas frecuentes.
- La mesa aparece como una tarjeta personal y descubre el plano con la asignación destacada.
- El álbum incorpora dedicatorias opcionales, visor con flechas y gestos, y ZIP de originales (30 archivos / 100 MB por tanda) generado en el navegador, sin volver a comprimir las imágenes o vídeos.
- Calendario de día completo para guardar la fecha, sin inventar horarios definitivos.

Las nuevas tablas se crean con `supabase/schema.sql`. Si ya se inicializó una versión anterior, ejecutar `supabase/upgrade-experience.sql` antes de desplegar la Edge Function actualizada. Las pruebas de backend siguen usando una base simulada: se ha verificado también el recorrido completo desde el despliegue público de Vercel hasta Supabase.

## Conexión real con Supabase

Proyecto `rxnzbrgkqmujpyvlvsum`, función `wedding-api`, tablas `invitations`, `wedding_settings` y `wedding_media`, bucket privado `wedding-memories`. La función comprueba la credencial privada del backend antes de atender cualquier operación. Las claves privilegiadas de Supabase permanecen dentro de Supabase.

La prueba real detectó que las subidas TUS con los tokens firmados de este proyecto eran rechazadas. El servidor entrega ahora una URL firmada de subida estándar y el cliente transfiere directamente el archivo con PUT, progreso y reintentos. Si la subida se interrumpe antes de completarse, se reenvía el archivo; no se afirma que continúe desde el último byte. Se mantiene compatibilidad con planes TUS de versiones anteriores.

El asesor de seguridad devuelve solo avisos informativos de RLS sin políticas: son intencionados, ya que anon/authenticated no tienen acceso directo y la función aplica las autorizaciones. Referencia: https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy .

Producción: https://web-boda-albertoyandrea.vercel.app . Verificado: sesión del organizador, enlace personal, asistencia persistida, aislamiento de visitantes del álbum, CORS de subida directa, publicación y descarga exacta del original. Los archivos técnicos se retiraron y la invitación técnica quedó desactivada. La invitación real de Jose está creada, sin respuesta ni mesa asignada. Las variables privadas no se incluyen en GitHub.

## Pulido visual y cuidado del álbum

Monograma A&A vectorial en sello, cabecera, icono y tarjetas QR imprimibles. Estilos unificados en azul tinta, marfil y terracota. Acceso al contenido con teclado y explicación de los datos personales y del álbum compartido.

El álbum muestra una cola por archivo: progreso, cancelación y reintento. Calcula SHA-256 para evitar repetir originales ya compartidos. Genera miniaturas WebP de hasta 960 px y 400 KB en el dispositivo, cuando el formato lo permite, sin alterar el original. Los vídeos sin miniatura no se descargan para pintar la cuadrícula. Si HEIC/MOV u otro original no se puede visualizar en el navegador, se ofrece la descarga. No hay conversión universal de formatos ni se garantiza visualización en todos los dispositivos.

La función limita las reservas a 60 por invitación/navegador cada diez minutos y 1800 por red en ese intervalo. La red se representa con un hash privado; no se guarda la dirección IP en la tabla. Los contadores se comprueban de forma atómica mediante una función SECURITY INVOKER solo accesible por service_role. No se afirma que esto sustituya un WAF ni que impida todo abuso.

Los avisos se guardan de forma privada y los novios pueden revisar, resolver y ocultar/mostrar recuerdos sin borrar sus originales. Los enlaces firmados ya emitidos pueden seguir funcionando hasta que caduquen (15 minutos).

El panel permite corregir nombres/contacto conservando el enlace, filtrar respuestas y exportar una copia JSON con enlaces privados, respuestas, ajustes e inventario. La recuperación añade invitaciones ausentes y conserva las existentes; restaurar los ajustes requiere una elección explícita. Los originales se descargan por separado en ZIP: el JSON no sustituye su copia ni configura copias automáticas del proveedor.

Para proyectos existentes se aplica `supabase/upgrade-album-care.sql` antes de desplegar la función actualizada. Las pruebas reales han verificado miniaturas, duplicados, avisos, ocultación reversible, cancelación y exportación. Las pruebas con interfaces móviles se realizan en navegador de escritorio: queda pendiente probar físicamente en iPhone y Android con fotos/vídeos reales de los invitados.
