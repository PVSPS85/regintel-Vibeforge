-- =============================================================================
-- Script:  storage/storage_policies.sql
-- Project: RegIntel by Vibeforge
-- Purpose: Provision private Supabase Object Storage buckets and enforce
--          Row-Level Security access policies for secure, role-aware file
--          operations across the regulations and task-evidence stores.
--          Depends on: 20260620000001_create_core_tables
--                      20260620000002_security_policies
-- =============================================================================


-- ---------------------------------------------------------------------------
-- BUCKETS
-- Both buckets are provisioned as private (public = false). All object access
-- must pass through RLS policies defined below — no anonymous public URLs.
-- INSERT ... ON CONFLICT DO NOTHING makes this script safe to re-run.
-- ---------------------------------------------------------------------------

-- 'regulations-store': holds master RBI circular PDFs uploaded by admins.
INSERT INTO storage.buckets (id, name, public)
VALUES ('regulations-store', 'regulations-store', false)
ON CONFLICT (id) DO NOTHING;

-- 'task-evidence': holds operational file proofs submitted by employees
-- as evidence of Action Point completion.
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-evidence', 'task-evidence', false)
ON CONFLICT (id) DO NOTHING;


-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- Must be explicitly activated on storage.objects before any policy takes
-- effect. This is idempotent — safe to run even if already enabled.
-- ---------------------------------------------------------------------------
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- RLS POLICIES: regulations-store
-- ===========================================================================

-- SELECT (Read): any authenticated user whose profile is marked active.
-- All bank employees with a valid, active account may download RBI circulars.
CREATE POLICY "regulations_store_select_policy"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'regulations-store'
    AND EXISTS (
        SELECT 1
        FROM   public.users u
        WHERE  u.id        = auth.uid()
        AND    u.is_active = true
    )
);

-- INSERT (Write): restricted to administrative roles only.
-- Only Branch Admin, Branch Manager, and System Admin may upload new circulars.
CREATE POLICY "regulations_store_insert_policy"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'regulations-store'
    AND EXISTS (
        SELECT 1
        FROM   public.users u
        WHERE  u.id   = auth.uid()
        AND    u.role IN ('Branch Admin', 'Branch Manager', 'System Admin')
    )
);


-- ===========================================================================
-- RLS POLICIES: task-evidence
-- Branch-isolated file access: a user may only read or write evidence objects
-- that belong to their own branch workspace, unless they carry a global role
-- (Auditor or System Admin) which grants cross-branch visibility.
--
-- Branch association is derived by matching the object's owner_id back to a
-- user whose branch_id equals the authenticated user's branch_id. This ensures
-- that even if a direct object URL is obtained, the policy blocks cross-branch
-- reads at the database layer.
-- ===========================================================================

-- SELECT (Read): same-branch users, or global Auditor / System Admin roles.
CREATE POLICY "task_evidence_select_policy"
ON storage.objects
FOR SELECT
USING (
    bucket_id = 'task-evidence'
    AND (
        -- Global roles bypass branch isolation for cross-branch audit access.
        EXISTS (
            SELECT 1
            FROM   public.users u
            WHERE  u.id   = auth.uid()
            AND    u.role IN ('Auditor', 'System Admin')
        )
        OR
        -- Branch-scoped access: the authenticated user and the object owner
        -- must share the same branch_id in public.users.
        EXISTS (
            SELECT 1
            FROM   public.users requester
            JOIN   public.users object_owner
                ON object_owner.branch_id = requester.branch_id
            WHERE  requester.id  = auth.uid()
            AND    object_owner.id = owner_id
        )
    )
);

-- INSERT (Write): same-branch users, or global Auditor / System Admin roles.
CREATE POLICY "task_evidence_insert_policy"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'task-evidence'
    AND (
        -- Global roles may upload evidence on behalf of any branch.
        EXISTS (
            SELECT 1
            FROM   public.users u
            WHERE  u.id   = auth.uid()
            AND    u.role IN ('Auditor', 'System Admin')
        )
        OR
        -- Branch-scoped upload: uploader's branch must match the object
        -- owner's branch, enforcing workspace isolation at write time.
        EXISTS (
            SELECT 1
            FROM   public.users requester
            JOIN   public.users object_owner
                ON object_owner.branch_id = requester.branch_id
            WHERE  requester.id  = auth.uid()
            AND    object_owner.id = owner_id
        )
    )
);
