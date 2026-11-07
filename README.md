# Andrea + Alberto · 16 de septiembre de 2027

Versión 3 del proyecto: Next.js para Vercel, Postgres y Storage privados en Supabase. Incluye la fotografía provisional real facilitada por el usuario. La publicación anterior de Sites es un prototipo distinto; este proyecto no depende de Cloudflare, D1, R2 ni de un inicio de sesión con ChatGPT.

## Experiencia

Invitación en marfil y burdeos, nombres caligráficos, ilustraciones vectoriales originales, cuenta atrás y fotografía auténtica. Navegación por escenas, adaptación móvil y reducción de movimiento accesible. La confirmación y la mesa se abren con la invitación personal. La galería admite fotos y vídeos con subida directa y reintentos mediante TUS.

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

Compilación de producción y TypeScript comprobados. Veintitrés pruebas automáticas cubren importación, mensajes, cifrado, autenticación del backend, invitados autorizados, publicación de mesas, álbum compartido, separación de datos privados y revocación. Las pruebas de backend usan una base simulada: la integración con los recursos reales todavía no se ha comprobado.

El proyecto Supabase está creado. La configuración de tablas, Storage y la Edge Function queda preparada en este código, pendiente del enlace y los secretos de Vercel. El proyecto de Vercel existe y el usuario gestiona su conexión con GitHub. La integración no permite consultar su configuración por falta de permisos del equipo.

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
