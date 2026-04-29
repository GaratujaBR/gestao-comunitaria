"""Seed quartos das Casas de Apoio."""
import httpx

BASE = "https://gestao-comunitaria.onrender.com"

rooms = [
    # Casa de Apoio 1 — quartos ocupados até fim de 2026
    {"slug": "casa-de-apoio-1-quarto-1", "nome": "Quarto 1", "parent_slug": "casa-de-apoio-1", "status": "inativo", "instrucoes_acesso": "Ocupado até dezembro de 2026"},
    {"slug": "casa-de-apoio-1-quarto-2", "nome": "Quarto 2", "parent_slug": "casa-de-apoio-1", "status": "inativo", "instrucoes_acesso": "Ocupado até dezembro de 2026"},
    {"slug": "casa-de-apoio-1-quarto-3", "nome": "Quarto 3", "parent_slug": "casa-de-apoio-1", "status": "inativo", "instrucoes_acesso": "Ocupado até dezembro de 2026"},
    # Casa de Apoio 2 — quartos disponíveis para reserva
    {"slug": "casa-de-apoio-2-quarto-1", "nome": "Quarto 1", "parent_slug": "casa-de-apoio-2", "status": "ativo"},
    {"slug": "casa-de-apoio-2-quarto-2", "nome": "Quarto 2", "parent_slug": "casa-de-apoio-2", "status": "ativo"},
    {"slug": "casa-de-apoio-2-quarto-3", "nome": "Quarto 3", "parent_slug": "casa-de-apoio-2", "status": "ativo"},
]

with httpx.Client() as client:
    for r in rooms:
        res = client.post(f"{BASE}/api/spaces", json=r)
        if res.status_code == 201:
            print(f"✓ {r['parent_slug']} / {r['nome']}")
        elif res.status_code == 409:
            print(f"- {r['slug']} já existe")
        else:
            print(f"✗ {r['slug']}: {res.status_code} {res.text}")
