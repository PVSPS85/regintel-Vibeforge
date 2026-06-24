-- =============================================================================
-- Test:    01_role_permissions_test.sql
-- Project: RegIntel by Vibeforge
-- Suite:   Role-Based Access Control (RBAC) Mutation Verification
-- Purpose: Prove that a user holding the 'Employee' role is correctly blocked
--          by the tasks INSERT RLS policy (tasks_insert_policy) and cannot
--          create new Action Points — a privilege reserved for Team Leader
--          and above.
--
-- Strategy:
--   1. Provision a mock branch, auth identity, and Employee profile.
--   2. Inject the Employee's UUID into the JWT GUC to simulate auth.uid().
--   3. Attempt a tasks INSERT inside a nested exception handler.
--   4. Assert the INSERT raises an RLS policy violation (insufficient_privilege).
--   5. If the INSERT succeeds without error, raise a FAIL exception immediately.
--   All mutations are wrapped in a transaction that is unconditionally rolled
--   back at the end, leaving zero residual data in the development database.
--
-- Depends on: 20260620000001_create_core_tables
--             20260620000002_security_policies
-- =============================================================================

BEGIN;

DO $$
DECLARE
    -- -----------------------------------------------------------------------
    -- Test fixture UUIDs — distinct from other test files to prevent
    -- accidental collision if migration state is partially applied.
    -- -----------------------------------------------------------------------

    -- Branch
    v_branch_delta_id   UUID := 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4';

    -- Auth identity (mirrored in auth.users to satisfy FK)
    v_auth_employee_id  UUID := 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5';

    -- Team required to satisfy tasks.team_id NOT NULL
    v_team_delta_id     UUID := 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6';

    -- Task ID for the insert attempt
    v_task_attempt_id   UUID := 'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7';

    -- Tracks whether the forbidden insert raised an exception as expected
    v_rls_blocked       BOOLEAN := false;
    v_block_detail      TEXT;

BEGIN

    -- =======================================================================
    -- STEP 1: Provision test branch
    -- =======================================================================
    RAISE NOTICE '[SETUP] Inserting Test Branch Delta…';

    INSERT INTO public.branches (id, branch_name, branch_code)
    VALUES (v_branch_delta_id, 'Test Branch Delta', 'BR-TEST-DELTA');

    RAISE NOTICE '[SETUP] Branch Delta created: %', v_branch_delta_id;


    -- =======================================================================
    -- STEP 2: Provision mock auth.users identity to satisfy the FK constraint
    --         on public.users.id → auth.users.id.
    -- =======================================================================
    RAISE NOTICE '[SETUP] Inserting mock auth identity for Employee…';

    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        is_super_admin,
        role
    )
    VALUES (
        v_auth_employee_id,
        'employee.delta@regintel.test',
        '$2a$10$placeholderhashedpasswordfortest000000000000000000000000',
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        false,
        'authenticated'
    );

    RAISE NOTICE '[SETUP] Auth identity provisioned: %', v_auth_employee_id;


    -- =======================================================================
    -- STEP 3: Provision the public Employee profile assigned to Branch Delta
    -- =======================================================================
    RAISE NOTICE '[SETUP] Inserting Employee user profile…';

    INSERT INTO public.users (id, full_name, email, role, branch_id, is_active)
    VALUES (
        v_auth_employee_id,
        'Test Employee Delta',
        'employee.delta@regintel.test',
        'Employee',
        v_branch_delta_id,
        true
    );

    RAISE NOTICE '[SETUP] Employee profile created — role: Employee, branch: %',
        v_branch_delta_id;


    -- =======================================================================
    -- STEP 4: Provision a team in Branch Delta to satisfy tasks.team_id NOT NULL.
    --         The team must exist so the INSERT reaches the RLS WITH CHECK
    --         evaluation rather than failing on a FK or NOT NULL constraint
    --         before RLS even fires.
    -- =======================================================================
    RAISE NOTICE '[SETUP] Creating Delta team fixture…';

    INSERT INTO public.teams (id, name, branch_id, leader_id)
    VALUES (v_team_delta_id, 'Delta Compliance Team', v_branch_delta_id, NULL);

    RAISE NOTICE '[SETUP] Delta team created: %', v_team_delta_id;


    -- =======================================================================
    -- STEP 5: Inject Employee session context
    --
    -- set_config with is_local = true scopes the JWT GUC to this transaction.
    -- auth.uid() will now resolve to v_auth_employee_id for the duration of
    -- this DO block, accurately simulating an authenticated Employee session.
    -- =======================================================================
    RAISE NOTICE '[TEST] Injecting Employee session — auth.uid() → %',
        v_auth_employee_id;

    PERFORM set_config(
        'request.jwt.claims',
        json_build_object(
            'sub',  v_auth_employee_id::text,
            'role', 'authenticated'
        )::text,
        true
    );

    RAISE NOTICE '[TEST] Session active — auth.uid() resolves to: %', auth.uid();
    RAISE NOTICE '[TEST] Resolved role from DB: %', get_auth_user_role();
    RAISE NOTICE '[TEST] Resolved branch from DB: %', get_auth_user_branch();


    -- =======================================================================
    -- STEP 6: Attempt a forbidden INSERT into tasks as the Employee.
    --
    -- The tasks_insert_policy WITH CHECK requires:
    --   branch_id = get_auth_user_branch()
    --   AND get_auth_user_role() IN ('Team Leader', 'Branch Manager',
    --                                'Branch Admin', 'System Admin')
    --
    -- Since this user's role is 'Employee', the role predicate evaluates to
    -- FALSE. PostgreSQL raises insufficient_privilege (SQLSTATE 42501) and
    -- aborts the INSERT before it touches any table page.
    --
    -- The nested BEGIN / EXCEPTION block catches the expected violation and
    -- sets v_rls_blocked = true. If no exception is raised, execution falls
    -- through to the FAIL assertion below.
    -- =======================================================================
    RAISE NOTICE '[TEST] Attempting forbidden task INSERT as Employee…';

    BEGIN
        INSERT INTO public.tasks (
            id,
            title,
            description,
            team_id,
            assigned_to,
            branch_id,
            status,
            priority,
            due_date
        )
        VALUES (
            v_task_attempt_id,
            'Unauthorised Employee Task Attempt',
            'This INSERT must be rejected by the tasks_insert_policy.',
            v_team_delta_id,
            v_auth_employee_id,
            v_branch_delta_id,
            'Pending',
            'Normal',
            CURRENT_DATE + INTERVAL '14 days'
        );

        -- If execution reaches this line, RLS did NOT block the insert.
        -- This is a critical security failure — raise immediately.
        RAISE EXCEPTION
            '[FAIL] RBAC CONSTRAINT BYPASS DETECTED — '
            'An Employee role (user: %) successfully inserted a task row (id: %) '
            'into public.tasks without being blocked by tasks_insert_policy. '
            'The WITH CHECK predicate on get_auth_user_role() is not evaluating '
            'correctly for the ''Employee'' enum value.',
            v_auth_employee_id,
            v_task_attempt_id;

    EXCEPTION
        WHEN insufficient_privilege THEN
            -- Expected outcome: RLS WITH CHECK rejected the insert.
            v_rls_blocked   := true;
            v_block_detail  := SQLERRM;
            RAISE NOTICE '[TEST] RLS violation caught (SQLSTATE 42501): %',
                v_block_detail;

        WHEN check_violation THEN
            -- Alternative SQLSTATE some PostgreSQL builds emit for RLS.
            v_rls_blocked   := true;
            v_block_detail  := SQLERRM;
            RAISE NOTICE '[TEST] Check violation caught (SQLSTATE 23514): %',
                v_block_detail;

        WHEN OTHERS THEN
            -- An unexpected error occurred — surface it as a test error, not
            -- a pass, to prevent masking genuine infrastructure problems.
            RAISE EXCEPTION
                '[ERROR] Unexpected exception during Employee insert attempt. '
                'SQLSTATE: %, Message: %',
                SQLSTATE, SQLERRM;
    END;


    -- =======================================================================
    -- STEP 7: Final assertion
    -- =======================================================================
    IF v_rls_blocked THEN
        RAISE NOTICE
            '[PASS] RBAC insert restriction verified — '
            'Employee role cannot create tasks. '
            'tasks_insert_policy WITH CHECK is enforcing role-based mutation '
            'control correctly. Blocked with: %',
            v_block_detail;
    ELSE
        -- Defensive guard — should never be reached if the nested block above
        -- correctly raises on a successful insert.
        RAISE EXCEPTION
            '[FAIL] Assertion state invalid — INSERT did not raise an exception '
            'and v_rls_blocked was never set. Review nested exception handler logic.';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '%', SQLERRM;

END;
$$;


-- =============================================================================
-- ROLLBACK — unconditionally discard all fixture data inserted above.
-- No branches, auth users, public users, teams, or task attempts from this
-- test will persist in the development database after this point.
-- =============================================================================
ROLLBACK;

RAISE NOTICE '[TEARDOWN] Transaction rolled back — zero residual test data remains.';
