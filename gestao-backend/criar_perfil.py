"""
Cria perfil no banco local para usuário já existente no Supabase.

Uso:
  python criar_perfil.py "Nome Completo" email@exemplo.com
  python criar_perfil.py "Nome Completo" email@exemplo.com --slug meu-slug
"""

import argparse
import re
import sqlite3
import uuid
from datetime import datetime, timezone

DB_PATH = "app.db"


def make_slug(nome: str, email: str) -> str:
    base = re.sub(r"[^a-z0-9-]+", "", nome.lower().strip().replace(" ", "-"))
    return base or email.split("@")[0]


def slug_livre(cur: sqlite3.Cursor, base: str) -> str:
    slug, counter = base, 2
    while True:
        cur.execute("SELECT 1 FROM profiles WHERE slug = ?", (slug,))
        if not cur.fetchone():
            return slug
        slug = f"{base}-{counter}"
        counter += 1


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("nome", help="Nome completo")
    parser.add_argument("email", help="Email (deve ser o mesmo cadastrado no Supabase)")
    parser.add_argument("--slug", default=None, help="Slug personalizado (opcional)")
    args = parser.parse_args()

    con = sqlite3.connect(DB_PATH)
    cur = con.cursor()

    cur.execute("SELECT slug, ativo FROM profiles WHERE email = ?", (args.email,))
    existing = cur.fetchone()
    if existing:
        print(f"Perfil já existe: slug={existing[0]}, ativo={bool(existing[1])}")
        con.close()
        return

    base_slug = args.slug or make_slug(args.nome, args.email)
    slug = slug_livre(cur, base_slug)
    profile_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    cur.execute(
        """
        INSERT INTO profiles (id, slug, nome_completo, email, ativo, is_admin, created_at)
        VALUES (?, ?, ?, ?, 1, 0, ?)
        """,
        (profile_id, slug, args.nome, args.email, now),
    )
    con.commit()
    con.close()

    print(f"Perfil criado: slug={slug}, email={args.email}")
    print("Faça login normalmente agora.")


if __name__ == "__main__":
    main()
