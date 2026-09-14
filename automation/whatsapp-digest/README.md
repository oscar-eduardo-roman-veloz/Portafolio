# Resumen diario de correo por WhatsApp

Tarea programada que cada manana lee los correos del dia anterior con el
conector de Gmail y manda un resumen a WhatsApp, sin intermediarios de pago y
sin aplicaciones de terceros: el unico servicio externo es la **WhatsApp Cloud
API oficial de Meta**.

```
Routine (cron diario)  ->  conector Gmail  ->  Claude clasifica
                                                    |
                                                    v
                                  wa_send.py -> graph.facebook.com -> tu WhatsApp
```

## Que hay aqui

| Archivo | Para que sirve |
|---|---|
| `wa_send.py` | Envia el resumen. Solo stdlib de Python 3, sin dependencias. |
| `wa_template.py` | Registra la plantilla en Meta y consulta si ya fue aprobada. |
| `test_wa_send.py` | Pruebas offline. No tocan la red. |
| `ROUTINE_PROMPT.md` | El prompt que se pega en la Routine. |

## Por que hace falta una plantilla

WhatsApp solo permite escribirte **texto libre** dentro de una ventana de 24 h
que se abre cuando *tu* le escribes al numero emisor. Un mensaje automatico a
las 7 a.m. cae fuera de esa ventana, asi que tiene que ser un **template
message** previamente aprobado por Meta.

Eso impone dos limites que este codigo ya resuelve:

- Los parametros `{{n}}` **no admiten saltos de linea, tabuladores ni mas de
  cuatro espacios seguidos**, y no pueden ir vacios. `sanitize_param()` los
  limpia y rellena con `Sin novedades`. Por eso el resumen se estructura en
  cuatro categorias de una linea y no como una lista de longitud variable: el
  texto estatico de la plantilla si lleva los saltos de linea.
- Desde el **1 de enero de 2026** Meta exige una URL HTTPS verificable en el
  cuerpo o en un boton. La plantilla incluye el enlace a Gmail.

`wa_send.py --mode text` manda texto libre con formato completo, util para
probar dentro de la ventana de 24 h, pero no sirve para el envio programado.

## Configuracion

### 1. Meta: app, numero de prueba y token

1. Crea una app en <https://developers.facebook.com/apps> de tipo **Business** y
   agrega el producto **WhatsApp**. Acepta la **cuenta de negocio de prueba**
   que Meta ofrece: no requiere tarjeta ni verificacion de negocio.
2. En **WhatsApp > API Setup** copia el **Phone number ID** y el
   **WhatsApp Business Account ID**.
3. En **To**, agrega tu numero personal como destinatario de prueba y
   verificalo con el codigo que llega por WhatsApp. El numero de prueba admite
   hasta **5 destinatarios verificados** y los mensajes hacia ellos no se
   cobran.
4. El token que muestra esa pantalla **vence en 24 h**. Genera uno permanente:
   **Business Settings > Users > System Users > Add**, rol *Admin*, luego
   **Generate New Token** sobre la app, con el permiso
   `whatsapp_business_messaging`. Ese es el que se usa.

> El numero emisor tiene que ser distinto de tu WhatsApp personal. Con el numero
> de prueba de Meta no hace falta que aportes ninguna linea propia.

### 2. Registrar la plantilla

```bash
export WA_WABA_ID=...      # WhatsApp Business Account ID
export WA_TOKEN=...        # token de System User
python3 wa_template.py --print     # revisa el cuerpo
python3 wa_template.py --create    # mandala a aprobacion
python3 wa_template.py --status    # repite hasta ver "APPROVED"
```

Una plantilla UTILITY suele aprobarse en minutos.

### 3. Entorno de la Routine

En <https://claude.ai/code/routines>, al editar la Routine, abre el selector de
entorno y luego el icono de ajustes:

- **Network access**: cambia a **Custom**, agrega `graph.facebook.com` y deja
  marcado *"Also include default list of common package managers"*. Sin esto la
  llamada falla con `403 host_not_allowed`: la lista **Trusted** por omision no
  incluye a Meta.
- **Variables de entorno**: `WA_PHONE_ID` y `WA_TO` (tu numero en E.164 sin `+`,
  por ejemplo `5215512345678`).
- **`WA_TOKEN`**: en planes Pro y Max guardalo como **API credential**, no como
  variable de entorno. Asi el token se adjunta a la peticion despues de salir
  del contenedor y Claude nunca lo ve. `wa_send.py` omite el header
  `Authorization` cuando `WA_TOKEN` no esta definido, justo para ese caso.

### 4. Crear la Routine

Nombre: *Resumen de correo por WhatsApp*. Instrucciones: el contenido de
[`ROUTINE_PROMPT.md`](ROUTINE_PROMPT.md). Repositorio: este. Conectores: deja
**solo Gmail** y quita el resto. Trigger: **Schedule > Daily** a la hora que
quieras.

El intervalo minimo de una Routine es de **una hora**, y el arranque real puede
correrse unos minutos por el stagger.

## Probar sin gastar un mensaje

```bash
python3 test_wa_send.py        # pruebas offline

echo '{"fecha":"13 sep 2026","total":12,
       "accion":"Banco X: cargo no reconocido de $1,200",
       "trabajo":"Ana envio el contrato para tu firma",
       "finanzas":"Recibo CFE $840 vence el 20",
       "otros":"3 boletines"}' | python3 wa_send.py --dry-run
```

`--dry-run` imprime el payload exacto sin llamar a la red ni requerir
credenciales.

## Cuando algo falla

| Sintoma | Causa |
|---|---|
| `403` / `host_not_allowed` | Falta `graph.facebook.com` en los dominios permitidos del entorno. |
| `190 Access token has expired` | Estas usando el token temporal de 24 h en vez del de System User. |
| `132001 Template name does not exist` | La plantilla aun no se aprueba, o `WA_LANG` no coincide con el idioma con el que se registro. |
| `131030 Recipient not in allowed list` | Falta verificar tu numero en **API Setup > To**. |
| `132000 Number of parameters does not match` | Cambiaste el cuerpo de la plantilla sin ajustar `CAMPOS` en `wa_send.py`. |
| La Routine corre en verde pero no llega nada | Verde solo significa que la sesion no fallo por infraestructura. Abre la ejecucion y lee la salida del script. |

## Lo que conviene saber antes de montarlo

- **Privacidad.** Los mensajes de la Cloud API los procesa Meta en sus
  servidores y no tienen el cifrado de extremo a extremo del WhatsApp personal.
  El resumen tambien pasa por Anthropic, que es quien lee tu Gmail. No
  interviene ningun tercero mas alla de esos dos.
- **Costo.** El numero de prueba con destinatarios verificados es gratuito. Si
  algun dia migras a un numero propio de produccion, las plantillas UTILITY se
  cobran por mensaje; a un envio diario es del orden de centavos al mes, pero
  deja de ser cero.
- **Cambio anunciado.** A partir del **1 de octubre de 2026** Meta empieza a
  cobrar tambien los mensajes dentro de la ventana de servicio de 24 h. No
  afecta al camino de plantilla con numero de prueba descrito aqui, pero
  conviene tenerlo en el radar.
- **Limite de la Routine.** Hay un tope diario de ejecuciones por cuenta y
  consumen el mismo cupo de uso que una sesion normal.
