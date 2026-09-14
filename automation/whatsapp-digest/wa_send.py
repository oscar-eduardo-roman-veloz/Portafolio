#!/usr/bin/env python3
"""Envia el resumen diario de correo a WhatsApp via WhatsApp Cloud API (Meta).

Solo usa la libreria estandar: no requiere pip install.

Uso:
    echo '{"fecha":"13 sep","total":12,"accion":"...","trabajo":"...",
           "finanzas":"...","otros":"..."}' | python3 wa_send.py
    python3 wa_send.py --file resumen.json --dry-run
    python3 wa_send.py --mode text --file resumen.json   # solo dentro de ventana 24h

Variables de entorno:
    WA_PHONE_ID   (obligatoria) Phone number ID del numero emisor en Meta.
    WA_TO         (obligatoria) Destinatario en E.164 sin '+', ej. 5215512345678.
    WA_TOKEN      (opcional)    Token permanente. Si se omite, no se manda header
                                Authorization y se asume que el proxy de
                                credenciales del entorno lo inyecta.
    WA_TEMPLATE   (opcional)    Nombre de la plantilla. Default: resumen_correo_diario
    WA_LANG       (opcional)    Codigo de idioma. Default: es_MX
    WA_API_VERSION(opcional)    Default: v23.0
"""

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request

# La API rechaza un parametro de plantilla con salto de linea, tabulador o mas de
# cuatro espacios seguidos. Tambien rechaza parametros vacios.
_WHITESPACE = re.compile(r"[\r\n\t\v\f]+")
_RUNS = re.compile(r" {2,}")

# Limite duro del cuerpo de una plantilla; dejamos margen para el texto estatico.
MAX_PARAM_LEN = 220

CAMPOS = ("fecha", "total", "accion", "trabajo", "finanzas", "otros")


def sanitize_param(value, max_len=MAX_PARAM_LEN):
    """Deja un valor apto para usarse como parametro {{n}} de una plantilla."""
    text = "" if value is None else str(value)
    text = _WHITESPACE.sub(" ", text)
    text = _RUNS.sub(" ", text).strip()
    if len(text) > max_len:
        # Cortar en el ultimo espacio para no partir una palabra a la mitad.
        recorte = text[: max_len - 1]
        if " " in recorte[-25:]:
            recorte = recorte[: recorte.rindex(" ")]
        text = recorte.rstrip(" ,;.") + "…"
    return text or "Sin novedades"


def build_template_payload(to, template, lang, datos):
    parametros = [
        {"type": "text", "text": sanitize_param(datos.get(campo))} for campo in CAMPOS
    ]
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "template",
        "template": {
            "name": template,
            "language": {"code": lang},
            "components": [{"type": "body", "parameters": parametros}],
        },
    }


def build_text_payload(to, datos):
    """Mensaje libre: admite saltos de linea, pero solo funciona si hay una
    ventana de servicio de 24 h abierta (tu respondiste al numero emisor)."""
    cuerpo = (
        "*Resumen de correo · {fecha}*\n\n"
        "Recibiste {total} correos ayer.\n\n"
        "\U0001f534 *Requiere acción:* {accion}\n"
        "\U0001f4bc *Trabajo:* {trabajo}\n"
        "\U0001f4b3 *Finanzas:* {finanzas}\n"
        "\U0001f4ce *Otros:* {otros}"
    ).format(**{campo: datos.get(campo) or "Sin novedades" for campo in CAMPOS})
    return {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": to,
        "type": "text",
        "text": {"preview_url": False, "body": cuerpo[:4096]},
    }


def send(payload, phone_id, token, api_version):
    url = "https://graph.facebook.com/{}/{}/messages".format(api_version, phone_id)
    cuerpo = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=cuerpo, method="POST")
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        detalle = err.read().decode("utf-8", "replace")
        raise SystemExit(
            "Meta respondio {}: {}\n"
            "Causas frecuentes: token vencido (usa uno de System User, no el "
            "temporal de 24 h), plantilla no aprobada, destinatario fuera de la "
            "lista de numeros de prueba, o graph.facebook.com no permitido en la "
            "red del entorno.".format(err.code, detalle)
        )
    except urllib.error.URLError as err:
        raise SystemExit(
            "No se pudo conectar con graph.facebook.com: {}\n"
            "Si estas en un entorno Claude Code, agrega graph.facebook.com a los "
            "dominios permitidos del entorno (Network access -> Custom).".format(err.reason)
        )


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--file", help="JSON con el resumen. Por omision lee stdin.")
    ap.add_argument("--mode", choices=("template", "text"), default="template")
    ap.add_argument("--dry-run", action="store_true", help="Imprime el payload sin enviar.")
    args = ap.parse_args()

    crudo = open(args.file, encoding="utf-8").read() if args.file else sys.stdin.read()
    if not crudo.strip():
        raise SystemExit("No se recibio JSON con el resumen.")
    try:
        datos = json.loads(crudo)
    except json.JSONDecodeError as err:
        raise SystemExit("El resumen no es JSON valido: {}".format(err))

    to = os.environ.get("WA_TO", "").lstrip("+").strip()
    phone_id = os.environ.get("WA_PHONE_ID", "").strip()
    if not args.dry_run and not (to and phone_id):
        raise SystemExit("Faltan WA_TO y/o WA_PHONE_ID en el entorno.")

    if args.mode == "template":
        payload = build_template_payload(
            to or "PENDIENTE",
            os.environ.get("WA_TEMPLATE", "resumen_correo_diario"),
            os.environ.get("WA_LANG", "es_MX"),
            datos,
        )
    else:
        payload = build_text_payload(to or "PENDIENTE", datos)

    if args.dry_run:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return

    respuesta = send(
        payload,
        phone_id,
        os.environ.get("WA_TOKEN", "").strip(),
        os.environ.get("WA_API_VERSION", "v23.0"),
    )
    print(json.dumps(respuesta, ensure_ascii=False))


if __name__ == "__main__":
    main()
