#!/usr/bin/env python3
"""Registra en Meta la plantilla que usa wa_send.py, y consulta su estado.

    python3 wa_template.py --print        # ver el cuerpo sin llamar a la API
    python3 wa_template.py --create       # enviarla a aprobacion
    python3 wa_template.py --status       # ver si ya fue aprobada

Variables de entorno:
    WA_WABA_ID    (obligatoria) WhatsApp Business Account ID.
    WA_TOKEN      (opcional)    Token permanente de System User.
    WA_TEMPLATE   (opcional)    Default: resumen_correo_diario
    WA_LANG       (opcional)    Default: es_MX
    WA_API_VERSION(opcional)    Default: v23.0

Notas:
  - El cuerpo estatico SI admite saltos de linea; los parametros {{n}} NO.
  - Desde el 1 de enero de 2026 Meta exige una URL HTTPS verificable en el
    cuerpo o en un boton; por eso la plantilla incluye el enlace a Gmail.
  - Categoria UTILITY: es la correcta para un resumen recurrente que tu pediste.
"""

import argparse
import json
import os
import urllib.error
import urllib.parse
import urllib.request

CUERPO = (
    "\U0001f4ec *Resumen de correo · {{1}}*\n"
    "\n"
    "Recibiste {{2}} correos ayer.\n"
    "\n"
    "\U0001f534 *Requiere acción:* {{3}}\n"
    "\U0001f4bc *Trabajo:* {{4}}\n"
    "\U0001f4b3 *Finanzas:* {{5}}\n"
    "\U0001f4ce *Otros:* {{6}}\n"
    "\n"
    "Abrir Gmail: https://mail.google.com/mail/u/0/#search/newer_than%3A1d"
)

EJEMPLOS = [
    "13 sep 2026",
    "12",
    "Banco X: cargo no reconocido de $1,200, vence hoy",
    "Ana envió el contrato revisado para tu firma",
    "Recibo CFE $840 con vencimiento el 20 de sep",
    "3 boletines y 2 notificaciones de LinkedIn",
]


def definicion(nombre, lang):
    return {
        "name": nombre,
        "language": lang,
        "category": "UTILITY",
        "components": [
            {
                "type": "BODY",
                "text": CUERPO,
                "example": {"body_text": [EJEMPLOS]},
            }
        ],
    }


def llamar(url, datos=None, token=None):
    req = urllib.request.Request(
        url,
        data=json.dumps(datos).encode("utf-8") if datos is not None else None,
        method="POST" if datos is not None else "GET",
    )
    if datos is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as err:
        raise SystemExit(
            "Meta respondio {}: {}".format(err.code, err.read().decode("utf-8", "replace"))
        )
    except urllib.error.URLError as err:
        raise SystemExit(
            "No se pudo conectar con graph.facebook.com: {}\n"
            "Agrega graph.facebook.com a los dominios permitidos del entorno.".format(err.reason)
        )


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    grupo = ap.add_mutually_exclusive_group(required=True)
    grupo.add_argument("--print", dest="mostrar", action="store_true")
    grupo.add_argument("--create", action="store_true")
    grupo.add_argument("--status", action="store_true")
    args = ap.parse_args()

    nombre = os.environ.get("WA_TEMPLATE", "resumen_correo_diario")
    lang = os.environ.get("WA_LANG", "es_MX")
    version = os.environ.get("WA_API_VERSION", "v23.0")
    token = os.environ.get("WA_TOKEN", "").strip()

    if args.mostrar:
        print(CUERPO)
        print("\n--- definicion que se enviaria ---")
        print(json.dumps(definicion(nombre, lang), indent=2, ensure_ascii=False))
        return

    waba = os.environ.get("WA_WABA_ID", "").strip()
    if not waba:
        raise SystemExit("Falta WA_WABA_ID en el entorno.")

    base = "https://graph.facebook.com/{}/{}/message_templates".format(version, waba)
    if args.create:
        print(json.dumps(llamar(base, definicion(nombre, lang), token), indent=2, ensure_ascii=False))
    else:
        consulta = urllib.parse.urlencode({"name": nombre, "fields": "name,status,category,language"})
        print(json.dumps(llamar(base + "?" + consulta, None, token), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
