-- ============================================================================
-- Migration: Enable Row Level Security (RLS) Hardening
-- Date: 2026-09-01
-- Resolves: Supabase linter errors
--   - rls_disabled_in_public (0013) on 14 tables
--   - sensitive_columns_exposed (0023) on accounts, verification_tokens
-- Project: gjayefmucuzhampxhide (Typemaster-db)
-- ============================================================================
--
-- CONTEXT
-- -------
-- TypeMaster uses Supabase as a hosted Postgres (DATABASE_URL =
-- postgresql://postgres:...@db.gjayefmucuzhampxhide.supabase.co:5432/postgres)
-- accessed exclusively via Prisma (apps/backend/src/utils/prisma.ts) and the
-- Express backend (apps/backend/src/index.ts). It does NOT use
-- @supabase/supabase-js / PostgREST from the frontend.
--
-- Supabase automatically exposes every table in the `public` schema via
-- PostgREST (https://gjayefmucuzhampxhide.supabase.co/rest/v1/<table>) using
-- the `anon` and `authenticated` roles. If Row Level Security (RLS) is not
-- enabled, any holder of the anon key can read/write all rows. Supabase
-- Database Linter flags this as:
--   ERROR 0013: rls_disabled_in_public
--   ERROR 0023: sensitive_columns_exposed (PII / tokens)
--
-- This migration follows Supabase recommended remediation for "backend-only"
-- access patterns (Prisma/Express):
--   https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public
--   Enable RLS with NO policies = deny-all for anon/authenticated, while
--   `postgres` and `service_role` (used by Prisma DATABASE_URL) bypass RLS
--   and continue to work unchanged.
--
-- AFFECTED TABLES (14)
-- --------------------
-- _prisma_migrations, users, accounts, sessions, verification_tokens,
-- test_results, lessons, user_lesson_progress, achievements,
-- user_achievements, game_scores, typing_mistakes, user_weak_keys,
-- user_skill_assessments
--
-- SENSITIVE COLUMNS
-- -----------------
-- accounts.access_token, accounts.refresh_token (OAuth tokens)
-- verification_tokens.token (email verification)
-- users.password (bcrypt hash, not pattern-matched but sensitive)
--
-- DESIGN DECISIONS
-- ----------------
-- 1. ENABLE ROW LEVEL SECURITY without CREATE POLICY => default deny for
--    anon/authenticated. Intentional: backend is the only authorized writer.
--    Alternative (per-user policies with auth.uid() = userId) was rejected
--    because the app does not use Supabase Auth / supabase-js.
-- 2. REVOKE ALL ON SCHEMA public FROM anon, authenticated => defense in
--    depth; blocks PostgREST even if RLS is later disabled. Supabase
--    recommends this for service-role-only projects.
-- 3. No changes to schema.prisma: RLS is a Postgres-level concern, invisible
--    to Prisma Client.
-- 4. Idempotent guards: DO blocks check pg_tables existence so migration
--    succeeds on fresh DBs and on Supabase where _prisma_migrations already
--    exists.
--
-- VERIFICATION
-- -----------
-- After `npx prisma migrate deploy`:
--   - Supabase Dashboard > Database > Linter should show 0 errors.
--   - `SELECT relname, relrowsecurity FROM pg_class WHERE relname IN (...)`
--     should return t for all tables.
--   - `curl -H "apikey: <anon>" https://gjayefmucuzhampxhide.supabase.co/rest/v1/users?select=*`
--     should return [] or 401, not user rows.
--   - App smoke test: login + GET /api/v1/lessons, /api/v1/tests must still
--     succeed (postgres bypasses RLS).
--
-- ROLLBACK
-- --------
-- To revert (not recommended):
--   ALTER TABLE "public"."<table>" DISABLE ROW LEVEL SECURITY;
--   GRANT USAGE ON SCHEMA public TO anon, authenticated;
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
--

-- Enable RLS on all application tables (deny-all for PostgREST anon/authenticated)
-- Using unconditional ALTER; tables are guaranteed to exist at this migration stage.

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."verification_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."test_results" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_lesson_progress" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_achievements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."game_scores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."typing_mistakes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_weak_keys" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."user_skill_assessments" ENABLE ROW LEVEL SECURITY;

-- Defense in depth: revoke direct PostgREST access for anon/authenticated.
-- Prisma uses the `postgres` / `service_role` role (bypasses RLS and grants), so app is unaffected.
-- Wrapped in DO blocks to remain idempotent on local Docker Postgres where anon/authenticated roles do not exist.
DO $$ BEGIN
  REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  REVOKE USAGE ON SCHEMA public FROM anon, authenticated;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;

-- Ensure future tables created in public also deny anon by default.
-- New tables will need explicit GRANT if they should be PostgREST-exposed.
DO $$ BEGIN
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
EXCEPTION WHEN undefined_object THEN NULL;
END $$;
