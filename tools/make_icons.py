#!/usr/bin/env python3
"""Gera os ícones do PWA (gota d'água estilizada sobre o verde-petróleo da marca).

Uso: python3 tools/make_icons.py   (grava em web/icons/)
Sem dependências além do Pillow. Determinístico — sem dados externos.
"""
from pathlib import Path

from PIL import Image, ImageDraw

ACCENT = (15, 76, 92)      # --accent  #0f4c5c
AGUA = (188, 216, 239)     # lago      #bcd8ef
BRANCO = (255, 255, 255)

OUT = Path(__file__).resolve().parent.parent / "web" / "icons"


def desenha(tam: int) -> Image.Image:
    s = 4  # superamostragem para bordas suaves
    n = tam * s
    img = Image.new("RGBA", (n, n), ACCENT + (255,))
    d = ImageDraw.Draw(img)

    # Gota: círculo + triângulo apontando para cima
    cx, cy, r = n // 2, int(n * 0.60), int(n * 0.26)
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BRANCO)
    topo = int(n * 0.14)
    d.polygon([(cx, topo), (cx - r + s, cy - int(r * 0.35)), (cx + r - s, cy - int(r * 0.35))], fill=BRANCO)

    # Miolo azul-água (lente da gota)
    r2 = int(r * 0.55)
    d.ellipse([cx - r2, cy - r2 + int(r * 0.1), cx + r2, cy + r2 + int(r * 0.1)], fill=AGUA)

    return img.resize((tam, tam), Image.LANCZOS)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for tam in (192, 512):
        desenha(tam).save(OUT / f"icon-{tam}.png")
        print(f"icon-{tam}.png ok")


if __name__ == "__main__":
    main()
