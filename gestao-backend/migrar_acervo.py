"""
Script one-time: importa Canaa_Acervo_Comunitario.xlsx -> /api/items

Uso:
  python migrar_acervo.py --api http://localhost:8000 --token SEU_TOKEN
  python migrar_acervo.py --api https://seu-backend.render.com --token SEU_TOKEN

O token e o URL do backend podem ser definidos via variaveis de ambiente:
  API_URL=http://localhost:8000
  API_TOKEN=...
"""

import sys
import re
import os
import argparse
import openpyxl
import requests

XLSX_PATH = os.path.join(os.path.dirname(__file__), "..", "planilhas", "Canaa_Acervo_Comunitario.xlsx")


def slugify(text: str) -> str:
    text = text.lower().strip()
    # normalizar acentos simplificado
    replacements = {
        "á": "a", "à": "a", "ã": "a", "â": "a",
        "é": "e", "ê": "e",
        "í": "i",
        "ó": "o", "ô": "o", "õ": "o",
        "ú": "u", "ü": "u",
        "ç": "c",
    }
    for k, v in replacements.items():
        text = text.replace(k, v)
    return re.sub(r"[^a-z0-9]+", "_", text).strip("_")


def normalize_categoria(cat: str) -> str:
    mapping = {
        "cozinha": "cozinha",
        "banheiro": "banheiro",
        "lazer": "lazer",
        "infraestrutura": "infraestrutura",
        "ferramentas": "ferramentas",
        "eletronicos": "eletronicos",
        "eletrônicos": "eletronicos",
        "saude": "saude",
        "saúde": "saude",
        "mobilia": "mobilia",
        "mobília": "mobilia",
        "limpeza": "limpeza",
        "construcao": "construcao",
        "outros": "outros",
        "jardim": "jardim",
    }
    return mapping.get(slugify(cat), slugify(cat))


def normalize_estado(estado: str, disponibilidade: str) -> str:
    e = slugify(estado)
    mapping = {
        "bom": "bom",
        "novo": "novo",
        "regular": "regular",
        "manutencao": "manutencao",
        "indisponivel": "indisponivel",
        "em_uso": "bom",
    }
    return mapping.get(e, "bom")


def parse_valor(val: str) -> float | None:
    if not val:
        return None
    cleaned = re.sub(r"[^\d,.]", "", val).replace(",", ".")
    try:
        return float(cleaned)
    except ValueError:
        return None


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--api", default=os.getenv("API_URL", "http://localhost:8000"))
    parser.add_argument("--token", default=os.getenv("API_TOKEN", ""))
    args = parser.parse_args()

    if not args.token:
        print("ERRO: --token obrigatorio (ou API_TOKEN no ambiente)")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {args.token}"}

    wb = openpyxl.load_workbook(XLSX_PATH, read_only=True, data_only=True)
    ws = wb["Cadastro"]

    rows = list(ws.iter_rows(values_only=True))
    data_rows = rows[1:]  # skip header

    created = 0
    skipped = 0
    errors = 0
    used_codigos: set[str] = set()

    for row in data_rows:
        if not row or not any(row):
            continue

        objeto = str(row[1] or "").strip()
        if not objeto:
            continue

        categoria_raw = str(row[2] or "").strip()
        descricao = str(row[3] or "").strip() or None
        qtdd_raw = str(row[4] or "").strip()
        local_area = str(row[5] or "").strip()
        estado_raw = str(row[6] or "").strip()
        responsavel = str(row[7] or "").strip() or None
        valor_raw = str(row[8] or "").strip()
        disponibilidade = str(row[9] or "").strip() or None
        origem = str(row[10] or "").strip() or None

        categoria = normalize_categoria(categoria_raw)
        estado = normalize_estado(estado_raw, disponibilidade or "")
        space_slug = slugify(local_area) if local_area else None
        quantidade = int(qtdd_raw) if qtdd_raw.isdigit() else None
        valor_estimado = parse_valor(valor_raw)

        base_codigo = f"{categoria}.{slugify(objeto)}"
        codigo = base_codigo
        idx = 1
        while codigo in used_codigos:
            codigo = f"{base_codigo}_{idx:02d}"
            idx += 1
        used_codigos.add(codigo)

        payload = {
            "codigo": codigo,
            "nome": objeto,
            "descricao": descricao,
            "space_slug": space_slug,
            "categoria": categoria,
            "estado": estado,
            "tipo": "comum",
            "quantidade": quantidade,
            "valor_estimado": valor_estimado,
            "responsavel": responsavel,
            "disponibilidade": disponibilidade,
            "origem": origem,
        }

        resp = requests.post(f"{args.api}/api/items", json=payload, headers=headers)

        if resp.status_code == 201 or resp.status_code == 200:
            print(f"  OK  {codigo} — {objeto}")
            created += 1
        elif resp.status_code == 409:
            print(f"  -- {codigo} ja existe, pulando")
            skipped += 1
        else:
            print(f"  ERR {codigo} — {resp.status_code}: {resp.text[:120]}")
            errors += 1

    print(f"\nMigracao concluida: {created} criados, {skipped} ja existiam, {errors} erros")


if __name__ == "__main__":
    main()
