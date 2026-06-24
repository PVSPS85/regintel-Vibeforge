-- =============================================================================
-- Test:    02_audit_trail_test.sql
-- Project: RegIntel by Vibeforge
-- Suite:   Automated Audit Trigger Validation and Ledger Verification
-- Purpose: Prove that mutating a compliance-sensitive table (tasks) correctly
--          fires the log_table_mutation_to_audit trigger, resulting in an
--          immutable JSONB snapshot of the state change being appended to
--          the audit_logs ledger.
--
-- Strategy:
--   1. Provision a mock branch, auth identity, Branch Manager profile, team,
--      and a target task in the 'Pending' state.
--   2. Inject the Manager's UUID into the JWT GUC to simulate auth.uid().
--   3. Execute an UPDATE on the task, changing its status to 'In Progress'.
--   4. Query public.audit_logs for the resulting 'UPDATE ON tasks' record.
--   5. Assert that the record exists and the details->'new_data' JSONB object
--      contains the correctly updated status.
--   6. Rollback all changes to keep the database clean.
--
-- Depends on: 20260620000001_create_core_tables
--             20260620000003_audit_triggers
-- =============================================================================

BEGIN;

DO $$
DECLARE
    -- Test fixture UUIDs
    v_branch_id   UUID := '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a';
    v_manager_id  UUID := '2b2b2b2b-2b2b-2b2b-2b2b-2b2b2b2b2b2b';
    v_team_id     UUID := '3c3c3c3c-3c3c-3c3c-3c3c-3c3c3c3c3c3c';
    v_task_id     UUID := '4d4d4d4d-4d4d-4d4d-4d4d-4d4d4d4d4d4d';

    -- Audit verification variables
    v_audit_count INTEGER;
    v_logged_status TEXT;
BEGIN
    -- =======================================================================
    -- STEP 1: Provision test fixtures
    -- =======================================================================
    RAISE NOTICE '[SETUP] Inserting Test Branch…';
    INSERT INTO public.branches (id, branch_name, branch_code)
    VALUES (v_branch_id, 'Audit Test Branch', 'BR-TEST-AUDIT');

    RAISE NOTICE '[SETUP] Inserting mock auth identity for Branch Manager…';
    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at, created_at,
        updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role
    ) VALUES (
        v_manager_id, 'manager.audit@regintel.test', 'hashedpassword',
        NOW(), NOW(), NOW(), '{"provider":"email"}', '{}', false, 'authenticated'
    );

    RAISE NOTICE '[SETUP] Inserting Branch Manager user profile…';
    INSERT INTO public.users (id, full_name, email, role, branch_id, is_active)
    VALUES (
        v_manager_id, 'Test Manager Audit', 'manager.audit@regintel.test',
        'Branch Manager', v_branch_id, true
    );

    RAISE NOTICE '[SETUP] Creating Team…';
    INSERT INTO public.teams (id, name, branch_id, leader_id)
    VALUES (v_team_id, 'Audit Compliance Team', v_branch_id, v_manager_id);

    RAISE NOTICE '[SETUP] Creating initial Task in "Pending" status…';
    INSERT INTO public.tasks (
        id, title, description, team_id, assigned_to, branch_id, status, priority, due_date
    ) VALUES (
        v_task_id, 'Audit Trail Verification Task', 'Task to test audit trigger',
        v_team_id, v_manager_id, v_branch_id, 'Pending', 'Normal', CURRENT_DATE + INTERVAL '5 days'
    );

    -- =======================================================================
    -- STEP 2: Inject Manager session context
    -- =======================================================================
    RAISE NOTICE '[TEST] Injecting Branch Manager session — auth.uid() → %', v_manager_id;
    PERFORM set_config(
        'request.jwt.claims',
        json_build_object('sub', v_manager_id::text, 'role', 'authenticated')::text,
        true
    );

    -- =======================================================================
    -- STEP 3: Execute UPDATE mutation
    -- =======================================================================
    RAISE NOTICE '[TEST] Updating task status to "In Progress"…';
    UPDATE public.tasks
    SET status = 'In Progress'
    WHERE id = v_task_id;

    -- =======================================================================
    -- STEP 4: Verify Audit Trail
    -- =======================================================================
    RAISE NOTICE '[TEST] Querying audit_logs for "UPDATE ON tasks" operation…';
    
    -- Check if the record exists
    SELECT COUNT(*)
    INTO v_audit_count
    FROM public.audit_logs
    WHERE user_id = v_manager_id
      AND action = 'UPDATE ON tasks'
      AND (details->'new_data'->>'id')::UUID = v_task_id;

    IF v_audit_count = 0 THEN
        RAISE EXCEPTION
            '[FAIL] AUDIT TRAIL FAILURE DETECTED — '
            'No "UPDATE ON tasks" record was found in public.audit_logs for '
            'task ID % mutated by user ID %. The compliance logging layer '
            'failed to record the operation.', v_task_id, v_manager_id;
    END IF;

    -- Extract the new status from the JSONB snapshot
    SELECT details->'new_data'->>'status'
    INTO v_logged_status
    FROM public.audit_logs
    WHERE user_id = v_manager_id
      AND action = 'UPDATE ON tasks'
      AND (details->'new_data'->>'id')::UUID = v_task_id
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_logged_status IS NULL THEN
         RAISE EXCEPTION
            '[FAIL] AUDIT TRAIL DATA MISSING — '
            'The audit_logs record exists, but the JSONB details snapshot '
            'is missing the "new_data" object or the "status" field.';
    ELSIF v_logged_status != 'In Progress' THEN
         RAISE EXCEPTION
            '[FAIL] AUDIT TRAIL MISMATCH — '
            'The logged status in the JSONB snapshot (%) does not match '
            'the updated state (In Progress).', v_logged_status;
    ELSE
        RAISE NOTICE
            '[PASS] Audit trail verified — "UPDATE ON tasks" recorded correctly. '
            'JSONB snapshot successfully captured the state transition to "%".',
            v_logged_status;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;
END;
$$;

-- =============================================================================
-- ROLLBACK — cleanly discard all test data from the transaction.
-- =============================================================================
ROLLBACK;
RAISE NOTICE '[TEARDOWN] Transaction rolled back — zero residual test data remains.';
