#!/usr/bin/env python3
"""Empacota os dados vetoriais em chunks para o modo offline.

Lê web/base-cartografica.json e web/nascentes.json (gerados por gen_data.py,
seed 2026 — este script NÃO regenera dados) e produz:

  web/chunks/base.json          base cartográfica (1 chunk)
  web/chunks/n-<i>-<j>.json     nascentes fatiadas numa grade GRID×GRID sobre o bbox
  web/chunks/manifest.json      lista de chunks com bytes e SHA-256 + total

O app usa o manifest para estimar o tamanho do download, mostrar progresso,
verificar a integridade de cada chunk (crypto.subtle) e gravar em IndexedDB.

Uso: python3 tools/make_chunks.py
"""
import hashlib
import json
from pathlib import Path

GRID = 3  # 3×3 → até 9 chunks de nascentes (70 pontos: didático e visível na barra)

WEB = Path(__file__).resolve().parent.parent / "web"
OUT = WEB / "chunks"


def escreve(path: Path, obj) -> bytes:
    dados = json.dumps(obj, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    path.write_bytes(dados)
    return dados


def main() -> None:
    OUT.mkdir(exist_ok=True)
    for velho in OUT.glob("*.json"):
        velho.unlink()

    base = json.loads((WEB / "base-cartografica.json").read_text(encoding="utf-8"))
    nasc = json.loads((WEB / "nascentes.json").read_text(encoding="utf-8"))
    feats = nasc["features"]

    lons = [f["geometry"]["coordinates"][0] for f in feats]
    lats = [f["geometry"]["coordinates"][1] for f in feats]
    lon0, lon1 = min(lons), max(lons)
    lat0, lat1 = min(lats), max(lats)
    dlon = (lon1 - lon0) / GRID or 1e-9
    dlat = (lat1 - lat0) / GRID or 1e-9

    celulas: dict[tuple[int, int], list] = {}
    for f in feats:
        lon, lat = f["geometry"]["coordinates"][:2]
        i = min(int((lon - lon0) / dlon), GRID - 1)
        j = min(int((lat - lat0) / dlat), GRID - 1)
        celulas.setdefault((i, j), []).append(f)

    chunks = []

    dados = escreve(OUT / "base.json", base)
    chunks.append({"file": "base.json", "tipo": "base", "bytes": len(dados),
                   "sha256": hashlib.sha256(dados).hexdigest()})

    for (i, j), fs in sorted(celulas.items()):
        nome = f"n-{i}-{j}.json"
        dados = escreve(OUT / nome, {"type": "FeatureCollection", "features": fs})
        chunks.append({"file": nome, "tipo": "nascentes", "qt": len(fs), "bytes": len(dados),
                       "sha256": hashlib.sha256(dados).hexdigest()})

    manifest = {
        "regiao": "Reserva Fictícia da Serra do Ribeirão",
        "bbox": [lon0, lat0, lon1, lat1],
        "grid": GRID,
        "totalBytes": sum(c["bytes"] for c in chunks),
        "chunks": chunks,
    }
    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8")

    print(f"{len(chunks)} chunks · {manifest['totalBytes']/1024:.1f} KB · manifest.json ok")


if __name__ == "__main__":
    main()
