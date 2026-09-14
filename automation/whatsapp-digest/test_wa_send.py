#!/usr/bin/env python3
"""Pruebas offline de wa_send.py: verifican que ningun parametro de plantilla
viole las reglas de Meta (sin \n, \t, \r, sin >4 espacios, no vacio, <=1024).

    python3 test_wa_send.py
"""
import json
import re
import subprocess
import sys
import os

AQUI = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, AQUI)

import wa_send  # noqa: E402

fallos = []


def check(nombre, condicion, detalle=""):
    if condicion:
        print("  ok   {}".format(nombre))
    else:
        print("  FALLA {} {}".format(nombre, detalle))
        fallos.append(nombre)


print("sanitize_param")
sucio = "Linea uno\nLinea dos\tcon tab\r\ny      seis espacios"
limpio = wa_send.sanitize_param(sucio)
check("elimina saltos de linea y tabs", not re.search(r"[\r\n\t]", limpio), repr(limpio))
check("colapsa espacios seguidos", not re.search(r" {2,}", limpio), repr(limpio))
check("no queda vacio con None", wa_send.sanitize_param(None) == "Sin novedades")
check("no queda vacio con cadena en blanco", wa_send.sanitize_param("   \n  ") == "Sin novedades")

largo = wa_send.sanitize_param("palabra " * 200)
check("respeta el limite de longitud", len(largo) <= wa_send.MAX_PARAM_LEN, len(largo))
check("marca el truncado", largo.endswith("\u2026"), repr(largo[-12:]))
check("no parte una palabra", " " not in largo[-2:])

print("build_template_payload")
datos = {
    "fecha": "13 sep 2026",
    "total": 12,
    "accion": "Banco X:\ncargo no reconocido de $1,200",
    "trabajo": "",
    "finanzas": None,
    "otros": "3 boletines",
}
payload = wa_send.build_template_payload("5215512345678", "resumen_correo_diario", "es_MX", datos)
params = payload["template"]["components"][0]["parameters"]

check("manda exactamente 6 parametros", len(params) == 6, len(params))
check("todos son type=text", all(p["type"] == "text" for p in params))
check(
    "ningun parametro viola el formato",
    all(not re.search(r"[\r\n\t]| {2,}", p["text"]) for p in params),
    [p["text"] for p in params],
)
check("ningun parametro va vacio", all(p["text"].strip() for p in params))
check("el numero total se serializa como texto", params[1]["text"] == "12", params[1])
check("los campos faltantes toman el relleno", params[3]["text"] == "Sin novedades")
check("messaging_product correcto", payload["messaging_product"] == "whatsapp")

print("build_text_payload")
texto = wa_send.build_text_payload("5215512345678", datos)["text"]["body"]
check("el modo libre si conserva saltos de linea", "\n" in texto)
check("el modo libre respeta el limite de 4096", len(texto) <= 4096, len(texto))

print("CLI --dry-run")
proc = subprocess.run(
    [sys.executable, os.path.join(AQUI, "wa_send.py"), "--dry-run"],
    input=json.dumps(datos), capture_output=True, text=True,
    env={**os.environ, "WA_TO": "", "WA_PHONE_ID": ""},
)
check("--dry-run termina bien sin credenciales", proc.returncode == 0, proc.stderr[:200])
check("--dry-run imprime JSON valido", bool(proc.stdout.strip()) and json.loads(proc.stdout))

proc_malo = subprocess.run(
    [sys.executable, os.path.join(AQUI, "wa_send.py"), "--dry-run"],
    input="no soy json", capture_output=True, text=True,
)
check("rechaza JSON invalido", proc_malo.returncode != 0 and "JSON" in proc_malo.stderr)

print()
if fallos:
    print("FALLARON {} pruebas: {}".format(len(fallos), ", ".join(fallos)))
    sys.exit(1)
print("Todas las pruebas pasaron.")
