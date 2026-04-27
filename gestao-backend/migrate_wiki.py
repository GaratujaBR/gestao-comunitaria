"""
Migra artigos wiki do SQLite local para a API de produção.
Uso: python migrate_wiki.py
"""
import sqlite3
import json
import urllib.request
import urllib.error

DB_PATH = "./app.db"
PROD_URL = "https://gestao-comunitaria.onrender.com/api/wiki"

conn = sqlite3.connect(DB_PATH)
conn.row_factory = sqlite3.Row
rows = conn.execute("SELECT * FROM wiki_articles").fetchall()
conn.close()

print(f"Encontrados {len(rows)} artigos no banco local.")

ok = 0
skip = 0
fail = 0

for row in rows:
    payload = {
        "slug": row["slug"],
        "titulo": row["titulo"],
        "categoria": row["categoria"],
        "conteudo": row["conteudo"],
        "resumo_ia": row["resumo_ia"],
        "entidades": json.loads(row["entidades"]) if row["entidades"] else None,
        "materiais": json.loads(row["materiais"]) if row["materiais"] else None,
        "dificuldade": row["dificuldade"],
        "tempo_execucao_horas": row["tempo_execucao_horas"],
        "autor_slug": row["autor_slug"],
        "validado": bool(row["validado"]),
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        PROD_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req) as resp:
            print(f"  ✓ {row['slug']}")
            ok += 1
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        if e.code == 409 or "already exists" in body or "duplicate" in body.lower() or "unique" in body.lower():
            print(f"  ~ {row['slug']} (já existe, pulando)")
            skip += 1
        else:
            print(f"  ✗ {row['slug']} — HTTP {e.code}: {body}")
            fail += 1

print(f"\nPronto: {ok} criados, {skip} já existiam, {fail} erros.")
