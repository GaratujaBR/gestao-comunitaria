-- ============================================================
-- RLS ECOVILA — v2: CORREÇÕES BASEADAS NO SCHEMA REAL
-- Aplique APÓS o script v1. Este arquivo:
--   (a) corrige funções auxiliares para o schema real
--   (b) adiciona colunas faltantes
--   (c) recria políticas incompatíveis
--   (d) documenta o que mudou e por quê
-- ============================================================


-- ============================================================
-- DIAGNÓSTICO: DIFERENÇAS ENCONTRADAS
-- ============================================================
--
-- TABELA        | ESPERADO NO v1          | REAL (screenshots)
-- --------------|-------------------------|----------------------------
-- profiles      | user_id uuid (FK)       | Visível: id text, slug, nome_completo,
--               | role text               | nome_curto, email, telefone, role text ✓
--               |                         | lote text, ativo bool, cota_slug varchar,
--               |                         | foto_url text
--               | FALTA CONFIRMAR:        | user_id provavelmente existe mas fora do
--               |                         | frame visível — VERIFIQUE abaixo
-- --------------|-------------------------|----------------------------
-- items         | disponivel_publico bool | NÃO EXISTE — coluna ausente
--               | user_id (para ownership)| NÃO EXISTE (item não tem dono individual)
-- --------------|-------------------------|----------------------------
-- sheet_rows    | visivel_cotistas bool   | NÃO EXISTE — colunas são:
--               |                         | area, status, responsavel, item,
--               |                         | descricao, quantidade, valor, total
-- ============================================================


-- ============================================================
-- PASSO 0: VERIFICAR SE user_id EXISTE EM PROFILES
-- ============================================================

-- Execute isto primeiro para checar:
-- SELECT column_name, data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- ORDER BY ordinal_position;

-- Se user_id NÃO existir, execute:
-- ALTER TABLE public.profiles
--   ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Se user_id JÁ existir (apenas fora do frame), pule esta linha.


-- ============================================================
-- PASSO 1: CORRIGIR is_admin() PARA USAR profiles.role
-- ============================================================
-- O schema real confirma que profiles.role text existe.
-- Podemos usar JOIN em profiles para is_admin() como fallback,
-- MAS mantemos app_metadata como fonte primária (mais performático).
-- A função abaixo tenta app_metadata primeiro; se vazio, cai em profiles.role.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT coalesce(
    -- Fonte 1: JWT app_metadata (sem JOIN, mais rápido)
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    -- Fonte 2: profiles.role como fallback (requer sincronização)
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role = 'admin'
        AND ativo = true
    ),
    false
  );
$$;

-- IMPORTANTE: mantenha profiles.role sincronizado com app_metadata.
-- Trigger sugerido para sincronização automática:

CREATE OR REPLACE FUNCTION sync_role_to_app_metadata()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualiza app_metadata no auth.users quando profiles.role mudar
  -- Requer que a função rode como service_role ou via extensão pg_net
  -- Alternativa: fazer via Edge Function que escuta o webhook de UPDATE em profiles
  -- Por ora, apenas registra a necessidade:
  RAISE NOTICE 'Role alterado para user_id %: novo role = %', NEW.user_id, NEW.role;
  RETURN NEW;
END;
$$;

-- Para sincronização real, use a Supabase Admin API no backend:
-- supabase.auth.admin.updateUserById(userId, { app_metadata: { role: newRole } })


-- ============================================================
-- PASSO 2: ADICIONAR COLUNAS FALTANTES
-- ============================================================

-- 2a. items: adicionar disponivel_publico
ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS disponivel_publico boolean NOT NULL DEFAULT false;

-- Raciocínio: itens do acervo não devem ser públicos por padrão.
-- Admin marca explicitamente quais podem ser vistos por visitantes.
-- Se quiser inverter (público por padrão), mude DEFAULT para true.

-- 2b. sheet_rows: adicionar visivel_cotistas
ALTER TABLE public.sheet_rows
  ADD COLUMN IF NOT EXISTS visivel_cotistas boolean NOT NULL DEFAULT false;

-- Raciocínio: dados importados de planilhas legadas são internos por padrão.
-- Admin ou círculo de dados libera seletivamente.

-- 2c. profiles: adicionar updated_at se não existir
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);


-- ============================================================
-- PASSO 3: RECRIAR POLÍTICAS INCOMPATÍVEIS
-- ============================================================

-- 3a. Remover política antiga de items que referenciava disponivel_publico
--     (pode ter falhado silenciosamente se a coluna não existia)
DROP POLICY IF EXISTS "items_anonimo_select_public" ON public.items;

-- Recriar agora que a coluna existe:
CREATE POLICY "items_anonimo_select_public"
  ON public.items
  FOR SELECT
  TO anon
  USING (disponivel_publico = true);

-- 3b. Remover e recriar política de sheet_rows
DROP POLICY IF EXISTS "sheet_rows_cotista_select_visivel" ON public.sheet_rows;

CREATE POLICY "sheet_rows_cotista_select_visivel"
  ON public.sheet_rows
  FOR SELECT
  TO authenticated
  USING (
    NOT is_admin()
    AND visivel_cotistas = true
  );


-- ============================================================
-- PASSO 4: POLÍTICA EXTRA — profiles sem user_id visível
-- ============================================================
-- Se profiles.id for o campo que mapeia para auth.uid() diretamente
-- (alguns projetos Supabase usam id = auth.uid()), ajuste assim:

-- CENÁRIO A: profiles.user_id = auth.uid()  [mais comum, recomendado]
--   → Políticas do v1 já estão corretas. Não mude nada.

-- CENÁRIO B: profiles.id = auth.uid()  [menos comum]
--   → Recriar políticas:

-- DROP POLICY IF EXISTS "profiles_cotista_select_own"  ON public.profiles;
-- DROP POLICY IF EXISTS "profiles_cotista_update_own"  ON public.profiles;
--
-- CREATE POLICY "profiles_cotista_select_own"
--   ON public.profiles FOR SELECT TO authenticated
--   USING (id::text = auth.uid()::text);
--
-- CREATE POLICY "profiles_cotista_update_own"
--   ON public.profiles FOR UPDATE TO authenticated
--   USING (id::text = auth.uid()::text)
--   WITH CHECK (id::text = auth.uid()::text);

-- ⚠️ Confirme qual cenário aplica antes de rodar o bloco acima.


-- ============================================================
-- PASSO 5: ÍNDICE ADICIONAL para profiles.ativo
-- ============================================================

-- is_admin() agora filtra ativo = true, então índice composto ajuda:
CREATE INDEX IF NOT EXISTS idx_profiles_user_id_role_ativo
  ON public.profiles (user_id, role, ativo);

-- Drop o índice simples anterior se desejar (opcional):
-- DROP INDEX IF EXISTS idx_profiles_role;


-- ============================================================
-- PASSO 6: POLÍTICA PARA cota_slug em profiles
-- ============================================================
-- cota_slug em profiles vincula um cotista à sua linha em cotas.
-- Se cotas.user_id não existir e a FK for via cota_slug, adapte:

-- Verificar se cotas tem user_id:
-- SELECT column_name FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'cotas';

-- Se cotas.cota_slug = profiles.cota_slug (sem user_id em cotas):
DROP POLICY IF EXISTS "cotas_cotista_select_own" ON public.cotas;

CREATE POLICY "cotas_cotista_select_own_via_slug"
  ON public.cotas
  FOR SELECT
  TO authenticated
  USING (
    NOT is_admin()
    AND cota_slug = (
      SELECT cota_slug FROM public.profiles
      WHERE user_id = auth.uid()
      LIMIT 1
    )
  );

-- Se cotas.user_id existir, reverta para a política original do v1:
-- DROP POLICY IF EXISTS "cotas_cotista_select_own_via_slug" ON public.cotas;
-- (política original do v1 já cobre isso)


-- ============================================================
-- PASSO 7: VERIFICAÇÃO FINAL
-- ============================================================

-- Liste todas as políticas criadas:
-- SELECT tablename, policyname, roles, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd;

-- Liste colunas adicionadas:
-- SELECT table_name, column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND column_name IN ('disponivel_publico', 'visivel_cotistas', 'user_id', 'updated_at')
-- ORDER BY table_name;


-- ============================================================
-- RESUMO DO QUE MUDOU DO v1 → v2
-- ============================================================
--
-- 1. is_admin() — agora usa profiles.role como fallback além de app_metadata
--                  filtra também ativo = true para evitar admins desativados
--
-- 2. items       — ADD COLUMN disponivel_publico boolean DEFAULT false
--                  política anon recriada
--
-- 3. sheet_rows  — ADD COLUMN visivel_cotistas boolean DEFAULT false
--                  política cotista recriada
--
-- 4. cotas       — política SELECT via cota_slug adicionada como alternativa
--                  caso não exista user_id na tabela cotas
--
-- 5. profiles    — documentado o ponto de verificação user_id vs id
--                  ADD COLUMN updated_at, created_by
--
-- PRÓXIMOS PASSOS RECOMENDADOS:
--   □ Confirmar se profiles.user_id existe (rode a query do Passo 0)
--   □ Confirmar se cotas.user_id existe
--   □ Setar role = 'admin' para seu usuário em profiles
--   □ Setar app_metadata via Admin API para consistência
--   □ Testar com Role switcher no Supabase (anon / authenticated / postgres)
-- ============================================================
