# Álbum y preparación de la boda

## Invitados

- El QR común abre `/#gallery`. Ver, subir y descargar no requiere una invitación personal.
- La cola permite añadir más archivos, pausar, continuar y cancelar. Si se pierde la conexión, espera hasta dos minutos para recuperar red; después ofrece reintentar.
- Una transferencia activa puede durar más de tres minutos. Se limita la inactividad (dos minutos) y se aplica un máximo de treinta minutos a cada transferencia.
- Las reservas propias se recuperan al elegir el mismo archivo. Si se cierra o recarga la pestaña hay que volver a seleccionarlo: no se guardan los vídeos completos en el almacenamiento del navegador. La transferencia del original puede reiniciarse desde el principio; **no se anuncia reanudación por fragmentos**.
- Las miniaturas son opcionales. Un fallo al generarlas no invalida un original ya guardado.

## Copias y recuperación

En el panel, «Copias y recuperación» contiene:

1. Inventario de originales, reservas y límite por archivo. El tamaño no es una lectura del uso facturado de Storage: no incluye miniaturas u objetos ajenos al inventario.
2. Calculadora orientativa (invitados, fotos y vídeos), sin modificar la suscripción.
3. Descarga de originales en ZIP de hasta 29 archivos y 99 MiB más su inventario JSON. Incluye ocultos. Los originales mayores se ofrecen individualmente.
4. Copia JSON de invitados, enlaces, respuestas, configuración e inventario del álbum. La restauración añade únicamente invitaciones ausentes. Sustituir ajustes necesita activar expresamente la casilla correspondiente.

Guardar **los ZIP y el JSON** fuera del proyecto y comprobar que se pueden abrir. Una descarga iniciada no prueba que el usuario haya conservado el archivo. Las copias del proveedor de base de datos no incluyen los archivos de Storage. Este panel no configura una segunda copia automática en la nube. Una restauración de invitaciones no restaura por sí sola las fotos o vídeos.

## Capacidad pendiente

Comprobado el 10 de noviembre de 2026: organización Free, bucket privado `wedding-memories`, máximo de 50 MiB por archivo. La cuota comercial actual debe comprobarse en Supabase antes de la boda. La revisión no contrata ampliaciones ni cambia facturación.

La protección de subidas permite 60 reservas por invitación/navegador y 6.000 por red compartida cada diez minutos, además de 200 archivos/1 GiB por propietario. El techo por red tiene en cuenta que muchos invitados usarán la misma Wi-Fi. No sustituye a una prueba de carga ni al dimensionado de espacio y transferencia.

Antes de repartir el QR: decidir espacio, transferencia y duración de conservación; comprobar un vídeo real de móvil y el ZIP; disponer de la copia JSON y los originales; revisar el plan para evitar pausas por inactividad o límites. Para admitir vídeos mayores hay que coordinar la validación del cliente, la función backend y los límites globales/del bucket. No aumentar solo una de esas capas.
