#!/usr/bin/env python3
"""
Migra dados do SQLite local (app.db) para PostgreSQL (Supabase).

Uso (execute do diretório gestao-backend):
    python migrar_para_supabase.py postgresql://user:pass@host:port/dbname

A URL pode ser obtida no Supabase dashboard:
    Settings → Database → Connection string (Transaction pooler, porta 6543)

Requer psycopg instalado: pip install "psycopg[binary]"
"""

import sys
import os
import sqlite3
import json
import re


# Ordem importa: enquetes antes de enquete_comentarios (FK)
TABLES_COLS = [
    ("cotas", ["id", "slug", "numero", "nome", "ativo", "created_at"]),
    ("profiles", [
        "id", "slug", "nome_completo", "nome_curto", "email", "telefone",
        "role", "lote", "cota_slug", "foto_url", "senha_hash", "is_admin",
        "ativo", "created_at",
    ]),
    ("spaces", [
        "id", "slug", "nome", "tipo", "capacidade", "area_m2",
        "caracteristicas", "regras_uso", "instrucoes_acesso", "fotos",
        "responsavel_slug", "parent_slug", "status", "created_at",
    ]),
    ("items", [
        "id", "codigo", "nome", "descricao", "space_slug",
        "container_especifico", "categoria", "tipo", "estado",
        "manual_cuidados", "ciclo_manutencao", "ultima_manutencao",
        "proxima_manutencao", "vezes_usado", "tags", "fotos",
        "qr_code_url", "created_at",
    ]),
    ("bookings", [
        "id", "space_slug", "item_codigos", "profile_slug", "cota_slug",
        "data_inicio", "data_fim", "tipo_uso", "finalidade",
        "numero_pessoas", "status", "checkin_itens", "checkout_itens",
        "checklist_entrada", "checklist_saida", "observacoes",
        "evento_id", "created_at",
    ]),
    ("logs", [
        "id", "item_codigo", "acao", "profile_slug", "booking_id",
        "timestamp", "local_uso", "condicao_saida", "condicao_retorno",
        "descricao_incidente", "fotos_evidencia", "clima", "sazonalidade",
    ]),
    ("wiki_articles", [
        "id", "slug", "titulo", "categoria", "conteudo", "resumo_ia",
        "entidades", "materiais", "dificuldade", "tempo_execucao_horas",
        "autor_slug", "validado", "created_at", "updated_at",
    ]),
    ("alerts", [
        "id", "tipo", "profile_slug", "titulo", "mensagem", "dados_json",
        "lido", "data_acao", "created_at",
    ]),
    ("chamados", [
        "id", "numero", "estrutura", "area", "descricao", "prioridade",
        "tipo", "status", "prestador_id", "prestador_nome",
        "prestador_telefone", "solicitante", "resolucao", "created_at",
    ]),
    ("prestadores", [
        "id", "nome", "telefone", "especialidade", "empresa", "notas", "created_at",
    ]),
    ("enquetes", [
        "id", "titulo", "descricao", "categoria", "tipo", "opcoes",
        "votos", "votantes", "total_votos", "criador", "multipla_escolha",
        "anonima", "status", "quorum_required", "approval_threshold",
        "closes_at", "voting_starts_at", "result_action", "respostas", "created_at",
    ]),
    ("enquete_comentarios", ["id", "enquete_id", "autor", "conteudo", "created_at"]),
    ("sheet_rows", [
        "id", "area", "status", "responsavel", "item", "descricao",
        "quantidade", "valor", "total", "created_at",
    ]),
    ("eventos", [
        "id", "titulo", "descricao", "data_inicio", "data_fim", "tipo",
        "local_slug", "criador_slug", "cor", "publico", "created_at",
    ]),
]

# Colunas armazenadas como texto JSON no SQLite que precisam ser parseadas
JSON_COLS: dict[str, set[str]] = {
    "spaces": {"caracteristicas", "fotos"},
    "items": {"tags", "fotos"},
    "bookings": {"item_codigos", "checklist_entrada", "checklist_saida"},
    "logs": {"fotos_evidencia"},
    "enquetes": {"opcoes", "votos", "votantes", "respostas"},
    "alerts": {"dados_json"},
    "wiki_articles": {"entidades", "materiais"},
}

# Colunas booleanas armazenadas como 0/1 no SQLite
BOOL_COLS: dict[str, set[str]] = {
    "profiles": {"is_admin", "ativo"},
    "cotas": {"ativo"},
    "wiki_articles": {"validado"},
    "alerts": {"lido"},
    "enquetes": {"multipla_escolha", "anonima"},
    "eventos": {"publico"},
}


def to_pg_url(url: str) -> str:
    url = re.sub(r"postgresql\+\w+://", "postgresql://", url)
    url = re.sub(r"postgres\+\w+://", "postgresql://", url)
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


def get_sqlite_cols(conn: sqlite3.Connection, table: str) -> set[str]:
    cur = conn.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cur.fetchall()}


def adapt_value(val, col: str, table: str):
    json_cols = JSON_COLS.get(table, set())
    bool_cols = BOOL_COLS.get(table, set())

    if val is None:
        return None
    if col in json_cols and isinstance(val, str):
        try:
            return json.loads(val)
        except Exception:
            return val
    if col in bool_cols:
        return bool(val)
    return val


def migrate(sqlite_path: str, pg_url: str):
    import psycopg
    from psycopg.types.json import Jsonb

    sqlite_conn = sqlite3.connect(sqlite_path)
    sqlite_conn.row_factory = sqlite3.Row

    total_inserted = 0

    with psycopg.connect(pg_url) as pg:
        for table, model_cols in TABLES_COLS:
            existing_sqlite_cols = get_sqlite_cols(sqlite_conn, table)
            if not existing_sqlite_cols:
                print(f"  {table}: não existe no SQLite, pulando")
                continue

            cols = [c for c in model_cols if c in existing_sqlite_cols]
            rows = sqlite_conn.execute(
                f"SELECT {', '.join(cols)} FROM {table}"
            ).fetchall()

            if not rows:
                print(f"  {table}: vazio")
                continue

            json_cols = JSON_COLS.get(table, set())
            col_list = ", ".join(cols)
            placeholders = ", ".join(["%s"] * len(cols))
            sql = (
                f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) "
                f"ON CONFLICT (id) DO NOTHING"
            )

            inserted = 0
            skipped = 0
            for row in rows:
                vals = []
                for col in cols:
                    v = adapt_value(row[col], col, table)
                    if col in json_cols and v is not None and not isinstance(v, str):
                        v = Jsonb(v)
                    vals.append(v)

                try:
                    pg.execute(sql, vals)
                    inserted += 1
                except Exception as e:
                    skipped += 1
                    if skipped <= 5:
                        print(f"    Aviso ({table}): {e}")
                    pg.rollback()

            pg.commit()
            total_inserted += inserted
            print(f"  {table}: {inserted} inseridos, {skipped} ignorados")

    sqlite_conn.close()
    print(f"\nTotal: {total_inserted} linhas migradas.")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        print("ERRO: informe a DATABASE_URL do Supabase Postgres como argumento.")
        sys.exit(1)

    pg_url = to_pg_url(sys.argv[1])

    sqlite_path = "app.db"
    if not os.path.exists(sqlite_path):
        sqlite_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.db")
    if not os.path.exists(sqlite_path):
        print("ERRO: app.db não encontrado. Execute do diretório gestao-backend.")
        sys.exit(1)

    print(f"SQLite:     {sqlite_path}")
    print(f"PostgreSQL: {pg_url[:50]}...")
    print()

    try:
        migrate(sqlite_path, pg_url)
        print("Migração concluída!")
    except ImportError:
        print("ERRO: instale psycopg → pip install 'psycopg[binary]'")
        sys.exit(1)
    except Exception as e:
        print(f"ERRO: {e}")
        raise


if __name__ == "__main__":
    main()
