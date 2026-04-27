"""
Cria as 40 bolinhas na API de produção (se ainda não existirem).
Uso: python seed_bolinhas.py
"""
import json
import urllib.request
import urllib.error

PROD_URL = "https://gestao-comunitaria.onrender.com/api/cotas"

ok = 0
skip = 0
fail = 0

for n in range(1, 41):
    slug = f"cota-{n:02d}"
    payload = {
        "slug": slug,
        "numero": n,
        "nome": f"Bolinha {n:02d}",
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        PROD_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req):
            print(f"  ✓ {slug}")
            ok += 1
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code in (409, 422) or "already exists" in body or "unique" in body.lower() or "duplicate" in body.lower():
            print(f"  ~ {slug} (já existe)")
            skip += 1
        else:
            print(f"  ✗ {slug} — HTTP {e.code}: {body}")
            fail += 1

print(f"\nPronto: {ok} criadas, {skip} já existiam, {fail} erros.")
