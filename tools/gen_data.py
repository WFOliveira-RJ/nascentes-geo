#!/usr/bin/env python3
"""Gera a cartografia vetorial fictícia e as nascentes sintéticas da
Reserva Fictícia da Serra do Ribeirão. Nenhum dado real é utilizado."""
import json, math, random

random.seed(2026)

# Região fictícia ~ 0.28° x 0.20° centrada em um ponto genérico do sudeste
CX, CY = -44.80, -22.40
W, H = 0.28, 0.20

def jitter(pts, amp):
    return [(x + random.uniform(-amp, amp), y + random.uniform(-amp, amp)) for x, y in pts]

def blob(cx, cy, rx, ry, n=14, rough=0.25):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        r = 1 + random.uniform(-rough, rough)
        pts.append((cx + math.cos(a) * rx * r, cy + math.sin(a) * ry * r))
    pts.append(pts[0])
    return pts

def path(p0, p1, n=24, wander=0.006):
    pts = [p0]
    for i in range(1, n):
        t = i / n
        x = p0[0] + (p1[0] - p0[0]) * t + random.uniform(-wander, wander)
        y = p0[1] + (p1[1] - p0[1]) * t + random.uniform(-wander, wander)
        pts.append((x, y))
    pts.append(p1)
    return pts

fc = {"type": "FeatureCollection", "features": []}

def add(geom, props):
    fc["features"].append({"type": "Feature", "geometry": geom, "properties": props})

# Limite da reserva
add({"type": "Polygon", "coordinates": [[list(p) for p in blob(CX, CY, W * 0.46, H * 0.46, 18, 0.10)]]},
    {"layer": "reserva", "nome": "Reserva Fictícia da Serra do Ribeirão"})

# Manchas de mata
for cx, cy, rx, ry in [(CX - 0.07, CY + 0.04, 0.05, 0.04), (CX + 0.06, CY + 0.02, 0.06, 0.05),
                        (CX - 0.02, CY - 0.05, 0.055, 0.04), (CX + 0.08, CY - 0.05, 0.035, 0.03)]:
    add({"type": "Polygon", "coordinates": [[list(p) for p in blob(cx, cy, rx, ry, 12, 0.3)]]},
        {"layer": "mata"})

# Lago fictício
add({"type": "Polygon", "coordinates": [[list(p) for p in blob(CX + 0.015, CY - 0.012, 0.020, 0.013, 12, 0.2)]]},
    {"layer": "lago", "nome": "Lago do Encontro"})

# Rios: nascem nas bordas altas e correm para o lago
rios = []
for i, (sx, sy) in enumerate([(CX - 0.11, CY + 0.075), (CX + 0.10, CY + 0.07),
                               (CX - 0.09, CY - 0.07), (CX + 0.11, CY - 0.055), (CX - 0.01, CY + 0.09)]):
    line = path((sx, sy), (CX + 0.015, CY - 0.012), n=26)
    rios.append(line)
    add({"type": "LineString", "coordinates": [list(p) for p in line]},
        {"layer": "rio", "nome": f"Ribeirão Fictício {i + 1}"})

# Trilha
add({"type": "LineString", "coordinates": [list(p) for p in path((CX - 0.12, CY - 0.02), (CX + 0.12, CY + 0.01), n=30, wander=0.01)]},
    {"layer": "trilha", "nome": "Trilha da Serra"})

with open("web/base-cartografica.json", "w") as f:
    json.dump(fc, f, ensure_ascii=False)

# Nascentes sintéticas: pontos próximos aos trechos altos dos rios
STATUS = ["REGISTRADA", "EM_ANALISE", "VALIDADA", "REJEITADA"]
PESOS  = [0.30, 0.25, 0.35, 0.10]
NOMES = ["Água Clara", "Pedra Azul", "Sete Quedas", "Mata Fria", "Boa Vista", "Canto do Sabiá",
         "Vale Verde", "Serra Alta", "Cachoeirinha", "Olho d'Água", "Recanto", "Ipê Amarelo",
         "Bromélia", "Samambaia", "Jequitibá", "Manacá", "Quaresmeira", "Paineira"]
VAZOES = ["baixa", "média", "alta"]

nasc = {"type": "FeatureCollection", "features": []}
nid = 1
for line in rios:
    trecho_alto = line[:len(line) // 2]
    for _ in range(14):
        x, y = random.choice(trecho_alto)
        x += random.uniform(-0.008, 0.008)
        y += random.uniform(-0.008, 0.008)
        status = random.choices(STATUS, PESOS)[0]
        nasc["features"].append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [round(x, 6), round(y, 6)]},
            "properties": {
                "id": nid,
                "nome": f"Nascente {random.choice(NOMES)} {nid:02d}",
                "status": status,
                "vazaoEstimada": random.choice(VAZOES),
                "responsavel": f"Agente Comunitário {random.randint(1, 9):02d}",
                "registradaEm": f"2026-{random.randint(3, 7):02d}-{random.randint(1, 28):02d}",
            },
        })
        nid += 1

with open("web/nascentes.json", "w") as f:
    json.dump(nasc, f, ensure_ascii=False)

print(f"base: {len(fc['features'])} feições | nascentes: {len(nasc['features'])}")
