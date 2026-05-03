# Guia de Migração — Dominios Aldeario
## De `aldeario.org/terradecanaa` para `app.aldeario.org`

---

### Visão Geral da Mudança

| Antes | Depois |
|-------|--------|
| `aldeario.org/terradecanaa` (path no Vercel) | `app.aldeario.org` (subdomínio) |
| App com hardcode "Terra de Canaã" | App genérico multi-comunidade |
| `BrowserRouter basename="/terradecanaa"` | `BrowserRouter` sem basename |
| Título fixo no HTML | Título dinâmico ou genérico |

---

### Passo 1: DNS (faça primeiro)

No painel onde gerencia o domínio `aldeario.org` (Registro.br, Cloudflare, etc):

```
Tipo: CNAME
Nome: app
Valor: cname.vercel-dns.com
TTL: 3600
```

Isso faz `app.aldeario.org` apontar pro Vercel.

---

### Passo 2: Vercel — Adicionar o domínio

1. Vá em **Project Settings > Domains**
2. Clique **Add Domain**
3. Digite: `app.aldeario.org`
4. O Vercel vai pedir pra verificar o DNS. Como já criou o CNAME, deve validar sozinho.

> **Importante:** NÃO adicione `aldeario.org/terradecanaa` — o Vercel não aceita path como domínio.

---

### Passo 3: Mudanças no Código

#### 3.1 `gestao-frontend/vercel.json`

**ANTES:**
```json
{
  "redirects": [
    { "source": "/", "destination": "/terradecanaa/", "permanent": false }
  ],
  "rewrites": [
    { "source": "/terradecanaa/(.*)", "destination": "/index.html" }
  ]
}
```

**DEPOIS:**
```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

> Removemos TUDO relacionado a `/terradecanaa`. Agora é SPA normal.

---

#### 3.2 `gestao-frontend/index.html`

**ANTES:**
```html
<title>Vilarejo Ecológico Terra de Canaã</title>
```

**DEPOIS:**
```html
<title>Aldeário — Gestão Comunitária</title>
```

> Ou deixe genérico. O nome da comunidade específica vai vir do banco de dados.

---

#### 3.3 `gestao-frontend/src/App.tsx`

**ANTES:**
```tsx
<BrowserRouter basename="/terradecanaa">
```

**DEPOIS:**
```tsx
<BrowserRouter>
```

**Arquivo completo depois:**
```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Spaces from "@/pages/Spaces";
import Items from "@/pages/Items";
import Bookings from "@/pages/Bookings";
import Logs from "@/pages/Logs";
import Wiki from "@/pages/Wiki";
import Alerts from "@/pages/Alerts";
import Spreadsheet from "@/pages/Spreadsheet";
import Chamados from "@/pages/Chamados";
import Enquetes from "@/pages/Enquetes";
import Cotas from "@/pages/Cotas";
import Eventos from "@/pages/Eventos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/espacos" element={<Spaces />} />
          <Route path="/acervo" element={<Items />} />
          <Route path="/reservas" element={<Bookings />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/alertas" element={<Alerts />} />
          <Route path="/planilha" element={<Spreadsheet />} />
          <Route path="/chamados" element={<Chamados />} />
          <Route path="/enquetes" element={<Enquetes />} />
          <Route path="/cotas" element={<Cotas />} />
          <Route path="/eventos" element={<Eventos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

---

#### 3.4 `gestao-frontend/src/components/Layout.tsx`

Precisamos remover os hardcodes de "Terra de Canaã" e "Vilarejo Ecológico".

**O que mudar:**

1. **Logo e nome no sidebar** — virar dinâmico (busca do Supabase)
2. **Header mobile** — remover "Terra de Canaã"

**Trecho do sidebar (procure no arquivo):**

**ANTES:**
```tsx
<img
  src={caliandraLogo}
  alt="Terra de Canaã"
  className="h-12 w-auto object-contain"
  draggable={false}
/>
<div className="text-center">
  <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#2D5A27]">
    Vilarejo Ecológico
  </div>
  <div className="text-base font-extrabold text-[#1A1A1A] tracking-[0.02em]">
    Terra de Canaã
  </div>
</div>
```

**DEPOIS (versão simples, sem busca no banco ainda):**
```tsx
<img
  src={caliandraLogo}
  alt="Logo da comunidade"
  className="h-12 w-auto object-contain"
  draggable={false}
/>
<div className="text-center">
  <div className="text-[10px] font-extrabold tracking-[0.2em] uppercase text-[#2D5A27]">
    Gestão Comunitária
  </div>
  <div className="text-base font-extrabold text-[#1A1A1A] tracking-[0.02em]">
    Aldeário
  </div>
</div>
```

**Trecho do header mobile (procure no arquivo):**

**ANTES:**
```tsx
<span className="flex-1 font-bold text-[#1A1A1A]">Terra de Canaã</span>
```

**DEPOIS:**
```tsx
<span className="flex-1 font-bold text-[#1A1A1A]">Aldeário</span>
```

> **Nota:** No futuro, esses nomes vão vir do Supabase (tabela `communities`). Mas por enquanto, deixe genérico.

---

#### 3.5 `gestao-frontend/src/pages/Dashboard.tsx`

Verifique se há hardcodes de "Terra de Canaã". No código que vimos, o Dashboard não tem — ele já é genérico. Só confirme que o título "Painel" está ok.

---

### Passo 4: Commit e Deploy

```bash
cd gestao-frontend
git add .
git commit -m "migra: remove path /terradecanaa, usa app.aldeario.org"
git push origin main
```

O Vercel vai fazer deploy automático. Acesse `app.aldeario.org` pra testar.

---

### Passo 5: Redirecionar o antigo (opcional)

Se alguém acessar `aldeario.org/terradecanaa`, pode cair em 404. Você tem duas opções:

**A) Deixar morrer naturalmente** — quem tinha o favorito atualiza.

**B) Redirecionar no Vercel do domínio raiz** — se você tiver controle do projeto que serve `aldeario.org`, adicione:

```json
{
  "redirects": [
    { "source": "/terradecanaa/:path*", "destination": "https://app.aldeario.org/:path*", "permanent": true }
  ]
}
```

---

### Resumo das Mudanças no Repo

| Arquivo | O que muda |
|---------|-----------|
| `vercel.json` | Remove redirects/rewrites de `/terradecanaa` |
| `index.html` | Título genérico |
| `src/App.tsx` | Remove `basename="/terradecanaa"` |
| `src/components/Layout.tsx` | Remove hardcodes "Terra de Canaã" |
| `src/pages/Dashboard.tsx` | (já está ok) |

---

### Próximos Passos (futuro)

1. **Multi-tenancy:** O app vai buscar a comunidade do usuário logado no Supabase (`community_members` → `communities`).
2. **Site público:** Criar projeto separado para `terradecanaa.aldeario.org` (site de visitantes).
3. **Portal:** Criar `aldeario.org` como landing page listando todas as ecovilas.

---

*Gerado para o repositório: https://github.com/GaratujaBR/gestao-comunitaria*
