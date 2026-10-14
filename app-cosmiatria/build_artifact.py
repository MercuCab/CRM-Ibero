#!/usr/bin/env python3
"""Arma la versión de un solo archivo para publicar como artefacto de Claude.

Junta index.html, styles.css, data.js, fotos.js y app.js en
dist/piel-serena.html. La página lleva adentro su propia plantilla
(window.COSMIA_TEMPLATE) para poder volver a publicarse sola cuando se
cargan fotos, y la lista de fotos en <script id="cosmia-fotos">.

Uso:  python3 build_artifact.py [fotos.json]
  fotos.json (opcional): lista de fotos ya publicada, para no perderla
  al volver a publicar desde el repo.
"""
import json
import re
import sys
from pathlib import Path

AQUI = Path(__file__).resolve().parent
MARCA_T, MARCA_F = "__COSMIA_T__", "__COSMIA_F__"


def leer(nombre):
    return (AQUI / nombre).read_text(encoding="utf-8")


def seguro(valor):
    # Igual que en fotos.js: JSON apto para ir dentro de un <script>
    return json.dumps(valor, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")


def main():
    html = leer("index.html")
    cuerpo = re.search(r"<body>(.*)</body>", html, re.S).group(1)
    cuerpo = re.sub(r'\s*<script src="[^"]+"></script>', "", cuerpo)
    fuentes = re.findall(r'<link rel="(?:preconnect|stylesheet)" href="https://fonts[^>]*>', html)

    plantilla = "\n".join([
        "<title>Piel Serena</title>",
        '<meta name="claude:viewport-fit-sides" content="cover">',
        *fuentes,
        "<style>\n" + leer("styles.css") + "</style>",
        cuerpo.strip(),
        f'<script type="application/json" id="cosmia-fotos">{MARCA_F}</script>',
        f"<script>window.COSMIA_TEMPLATE = {MARCA_T};</script>",
        "<script>\n" + leer("data.js") + "</script>",
        "<script>\n" + leer("fotos.js") + "</script>",
        "<script>\n" + leer("app.js") + "</script>",
    ]) + "\n"

    fotos = {}
    if len(sys.argv) > 1:
        fotos = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))

    salida = re.sub(
        f"{MARCA_T}|{MARCA_F}",
        lambda m: seguro(plantilla) if m.group(0) == MARCA_T else seguro(fotos),
        plantilla,
    )
    destino = AQUI / "dist" / "piel-serena.html"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(salida, encoding="utf-8")
    print(f"{destino} ({len(salida.encode()) // 1024} KB)")


if __name__ == "__main__":
    main()
