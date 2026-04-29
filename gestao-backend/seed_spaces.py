"""Seed the 3 fixed spaces into production."""
import httpx

BASE = "https://gestao-comunitaria.onrender.com"

spaces = [
    {"slug": "churrasqueira-piscina", "nome": "Churrasqueira e Piscina", "tipo": "lazer", "status": "ativo"},
    {"slug": "casa-de-apoio-1",       "nome": "Casa de Apoio 1",          "tipo": "casa_apoio", "status": "ativo"},
    {"slug": "casa-de-apoio-2",       "nome": "Casa de Apoio 2",          "tipo": "casa_apoio", "status": "ativo"},
]

with httpx.Client() as client:
    for s in spaces:
        r = client.post(f"{BASE}/api/spaces", json=s)
        if r.status_code == 201:
            print(f"✓ {s['nome']}")
        elif r.status_code == 409:
            print(f"- {s['nome']} já existe")
        else:
            print(f"✗ {s['nome']}: {r.status_code} {r.text}")
