#!/usr/bin/env python3
"""Valida data/preguntas.json y genera los archivos derivados.

Uso:  python3 scripts/build.py

- Verifica IDs únicos, categorías/subcategorías/niveles válidos y prefijos.
- Exige de 1 a 5 subpreguntas por pregunta, sin repetirse; `contexto` es opcional.
- Detecta preguntas duplicadas (texto normalizado) y casi duplicadas (similitud >= 0.85).
- Genera data/preguntas.js (lo carga la app) y db/seed.sql (para la base SQL).
"""
import difflib
import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "data" / "preguntas.json"
OUT_JS = ROOT / "data" / "preguntas.js"
OUT_SQL = ROOT / "db" / "seed.sql"
SIMILARITY = 0.85


def normalize(text):
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", text)).strip()


def sql(value):
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "1" if value else "0"
    if isinstance(value, int):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def validate(db):
    errors, warnings = [], []
    niveles = {n["id"] for n in db["niveles"]}
    cats = {c["id"]: c for c in db["categorias"]}
    subcats = {c["id"]: {s["id"] for s in c["subcategorias"]} for c in db["categorias"]}
    seen_ids, seen_text = set(), {}

    for p in db["preguntas"]:
        pid = p["id"]
        if pid in seen_ids:
            errors.append(f"ID duplicado: {pid}")
        seen_ids.add(pid)
        cat = cats.get(p["categoria"])
        if not cat:
            errors.append(f"{pid}: categoría inexistente '{p['categoria']}'")
            continue
        if not pid.startswith(cat["prefijo"] + "-"):
            errors.append(f"{pid}: el prefijo debería ser '{cat['prefijo']}-'")
        if p["subcategoria"] not in subcats[cat["id"]]:
            errors.append(f"{pid}: subcategoría '{p['subcategoria']}' no existe en '{cat['id']}'")
        if p["nivel"] not in niveles:
            errors.append(f"{pid}: nivel inválido {p['nivel']}")
        subs = p.get("subpreguntas", [])
        if not 1 <= len(subs) <= 5:
            errors.append(f"{pid}: debe tener entre 1 y 5 subpreguntas (tiene {len(subs)})")
        if len({normalize(x) for x in subs}) != len(subs) or any(not x.strip() for x in subs):
            errors.append(f"{pid}: subpreguntas vacías o repetidas")
        norm = normalize(p["texto"])
        if norm in seen_text:
            errors.append(f"{pid}: duplicada de {seen_text[norm]}")
        for other_norm, other_id in seen_text.items():
            if other_norm != norm and difflib.SequenceMatcher(None, norm, other_norm).ratio() >= SIMILARITY:
                warnings.append(f"{pid} se parece mucho a {other_id}")
        seen_text[norm] = pid
    return errors, warnings


def build_sql(db):
    lines = ["-- Generado por scripts/build.py. No editar a mano.", "BEGIN;"]
    for n in db["niveles"]:
        lines.append(f"INSERT INTO niveles (id, nombre, descripcion) VALUES ({sql(n['id'])}, {sql(n['nombre'])}, {sql(n['descripcion'])});")
    for c in db["categorias"]:
        lines.append(
            "INSERT INTO categorias (id, prefijo, nombre, descripcion, emoji, color, adulto) VALUES "
            f"({sql(c['id'])}, {sql(c['prefijo'])}, {sql(c['nombre'])}, {sql(c['descripcion'])}, {sql(c['emoji'])}, {sql(c['color'])}, {sql(c['adulto'])});"
        )
        for s in c["subcategorias"]:
            lines.append(f"INSERT INTO subcategorias (categoria_id, id, nombre) VALUES ({sql(c['id'])}, {sql(s['id'])}, {sql(s['nombre'])});")
    for p in db["preguntas"]:
        lines.append(
            "INSERT INTO preguntas (id, categoria_id, subcategoria_id, nivel_id, texto, contexto, texto_normalizado) VALUES "
            f"({sql(p['id'])}, {sql(p['categoria'])}, {sql(p['subcategoria'])}, {sql(p['nivel'])}, {sql(p['texto'])}, "
            f"{sql(p.get('contexto'))}, {sql(normalize(p['texto']))});"
        )
        for orden, sub in enumerate(p["subpreguntas"], 1):
            lines.append(f"INSERT INTO subpreguntas (pregunta_id, orden, texto) VALUES ({sql(p['id'])}, {orden}, {sql(sub)});")
    lines.append("COMMIT;")
    return "\n".join(lines) + "\n"


def main():
    db = json.loads(SRC.read_text(encoding="utf-8"))
    errors, warnings = validate(db)
    for w in warnings:
        print("AVISO:", w)
    if errors:
        for e in errors:
            print("ERROR:", e)
        sys.exit(1)

    OUT_JS.write_text(
        "// Generado por scripts/build.py a partir de preguntas.json. No editar a mano.\n"
        "window.PREGUNTAS_DB = " + json.dumps(db, ensure_ascii=False, indent=1) + ";\n",
        encoding="utf-8",
    )
    OUT_SQL.write_text(build_sql(db), encoding="utf-8")

    print(f"OK: {len(db['preguntas'])} preguntas en {len(db['categorias'])} categorías.")
    for c in db["categorias"]:
        total = sum(1 for p in db["preguntas"] if p["categoria"] == c["id"])
        print(f"  {c['emoji']} {c['nombre']}: {total}")


if __name__ == "__main__":
    main()
