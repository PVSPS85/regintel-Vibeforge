-- =============================================================================
-- Migration: 20260620000003_audit_triggers
-- Project:   RegIntel by Vibeforge
-- Purpose:   Define a reusable SECURITY DEFINER trigger function that captures
--            INSERT, UPDATE, and DELETE mutations into the audit_logs table,
--            then bind it to core compliance-sensitive tables.
--            Depends on: 20260620000001_create_core_tables
--                        20260620000002_security_policies
-- =============================================================================


-- ---------------------------------------------------------------------------
-- TRIGGER FUNCTION: log_table_mutation_to_audit()
--
-- A single reusable function attached to multiple tables. On each mutation it:
--   1. Resolves the calling Supabase auth user and their branch.
--   2. Builds a JSONB snapshot appropriate to the operation type.
--   3. Inserts a structured, immutable row into public.audit_logs.
--
-- SECURITY DEFINER — runs with definer privileges so it can always write to
-- audit_logs regardless of the RLS policies active on the triggering table.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_table_mutation_to_audit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id   UUID;
    v_branch_id UUID;
    v_action    TEXT;
    v_details   JSONB;
BEGIN
    -- -----------------------------------------------------------------------
    -- Step 1: Resolve the currently authenticated session user and their branch.
    -- auth.uid() returns NULL for service-role / migration contexts; the audit
    -- row is still written with a NULL user_id in those cases to preserve
    -- the integrity of the append-only log.
    -- -----------------------------------------------------------------------
    v_user_id := auth.uid();

    SELECT branch_id
    INTO   v_branch_id
    FROM   public.users
    WHERE  id = v_user_id;

    -- -----------------------------------------------------------------------
    -- Step 2: Build the human-readable action label.
    -- Format: "INSERT ON users", "UPDATE ON tasks", "DELETE ON transfer_requests"
    -- -----------------------------------------------------------------------
    v_action := TG_OP || ' ON ' || TG_TABLE_NAME;

    -- -----------------------------------------------------------------------
    -- Step 3: Build the JSONB snapshot based on the mutation type.
    --   INSERT → capture the full new row.
    --   UPDATE → capture both old and new rows for precise diff auditing.
    --   DELETE → capture the full row being removed.
    -- -----------------------------------------------------------------------
    IF TG_OP = 'INSERT' THEN
        v_details := jsonb_build_object(
            'new_data', to_jsonb(NEW)
        );

    ELSIF TG_OP = 'UPDATE' THEN
        v_details := jsonb_build_object(
            'old_data', to_jsonb(OLD),
            'new_data', to_jsonb(NEW)
        );

    ELSIF TG_OP = 'DELETE' THEN
        v_details := jsonb_build_object(
            'old_data', to_jsonb(OLD)
        );
    END IF;

    -- -----------------------------------------------------------------------
    -- Step 4: Append the structured audit record.
    -- created_at defaults to CURRENT_TIMESTAMP in the table definition.
    -- -----------------------------------------------------------------------
    INSERT INTO public.audit_logs (user_id, branch_id, action, details)
    VALUES (v_user_id, v_branch_id, v_action, v_details);

    -- -----------------------------------------------------------------------
    -- Step 5: Return the appropriate record so the triggering DML succeeds.
    -- AFTER triggers require a non-NULL return; convention is NEW for
    -- INSERT/UPDATE and OLD for DELETE.
    -- -----------------------------------------------------------------------
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;


-- ---------------------------------------------------------------------------
-- TRIGGER: audit_users_mutations
-- Fires AFTER every INSERT, UPDATE, or DELETE on public.users.
-- Each row operation produces exactly one audit_logs entry (FOR EACH ROW).
-- ---------------------------------------------------------------------------
CREATE TRIGGER audit_users_mutations
AFTER INSERT OR UPDATE OR DELETE
ON public.users
FOR EACH ROW
EXECUTE FUNCTION log_table_mutation_to_audit();


-- ---------------------------------------------------------------------------
-- TRIGGER: audit_tasks_mutations
-- Fires AFTER every INSERT, UPDATE, or DELETE on public.tasks.
-- Captures full Action Point lifecycle events for compliance traceability.
-- ---------------------------------------------------------------------------
CREATE TRIGGER audit_tasks_mutations
AFTER INSERT OR UPDATE OR DELETE
ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION log_table_mutation_to_audit();


-- ---------------------------------------------------------------------------
-- TRIGGER: audit_transfer_requests_mutations
-- Fires AFTER every INSERT, UPDATE, or DELETE on public.transfer_requests.
-- Ensures every state transition in the dual-signature workflow is recorded.
-- ---------------------------------------------------------------------------
CREATE TRIGGER audit_transfer_requests_mutations
AFTER INSERT OR UPDATE OR DELETE
ON public.transfer_requests
FOR EACH ROW
EXECUTE FUNCTION log_table_mutation_to_audit();
