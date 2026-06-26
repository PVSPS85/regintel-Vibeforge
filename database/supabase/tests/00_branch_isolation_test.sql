-- =============================================================================
-- Test:    00_branch_isolation_test.sql
-- Project: RegIntel by Vibeforge
-- Suite:   Branch-Based Access Control (BBAC) Isolation Verification
-- Purpose: Prove that a user assigned to Branch Alpha cannot read task rows
--          that belong to Branch Beta through the tasks RLS SELECT policy.
--
-- Strategy:
--   All mutations are wrapped in a single transaction that is unconditionally
--   rolled back at the end, leaving zero residual data in the dev database.
--
--   Supabase's auth.uid() reads the JWT subject from the GUC:
--     current_setting('request.jwt.claims') ->> 'sub'
--   We exploit SET LOCAL to inject a mock JWT claim within the transaction,
--   safely simulating User A's authenticated session without touching auth state.
--
-- Depends on: 20260620000001_create_core_tables
--             20260620000002_security_policies
-- =============================================================================

BEGIN;

DO $$
DECLARE
    -- -----------------------------------------------------------------------
    -- Test fixture UUIDs — hardcoded so log output is deterministic.
    -- -----------------------------------------------------------------------

    -- Branches
    v_branch_alpha_id  UUID := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    v_branch_beta_id   UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

    -- Auth identities (must mirror public.users.id via FK → auth.users.id)
    v_auth_user_a_id   UUID := 'cccccccc-cccc-cccc-cccc-cccccccccccc';
    v_auth_user_b_id   UUID := 'dddddddd-dddd-dddd-dddd-dddddddddddd';

    -- Supporting fixtures
    v_team_beta_id     UUID := 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    v_task_beta_id     UUID := 'ffffffff-ffff-ffff-ffff-ffffffffffff';

    -- Assertion counter
    v_leaked_count     INTEGER;

BEGIN

    -- =======================================================================
    -- STEP 1: Provision test branches
    -- =======================================================================
    RAISE NOTICE '[SETUP] Inserting test branches…';

    INSERT INTO public.branches (id, branch_name, branch_code)
    VALUES
        (v_branch_alpha_id, 'Test Branch Alpha', 'BR-TEST-ALPHA'),
        (v_branch_beta_id,  'Test Branch Beta',  'BR-TEST-BETA');

    RAISE NOTICE '[SETUP] Branches created — Alpha: %, Beta: %',
        v_branch_alpha_id, v_branch_beta_id;


    -- =======================================================================
    -- STEP 2: Provision mock auth.users entries to satisfy the FK constraint
    --         on public.users.id → auth.users.id.
    -- =======================================================================
    RAISE NOTICE '[SETUP] Inserting mock auth identities…';

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
    VALUES
        (
            v_auth_user_a_id,
            'user.alpha@regintel.test',
            '$2a$10$placeholderhashedpasswordfortest000000000000000000000000',
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            false,
            'authenticated'
        ),
        (
            v_auth_user_b_id,
            'user.beta@regintel.test',
            '$2a$10$placeholderhashedpasswordfortest000000000000000000000000',
            NOW(),
            NOW(),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{}',
            false,
            'authenticated'
        );

    RAISE NOTICE '[SETUP] Auth identities provisioned — User A: %, User B: %',
        v_auth_user_a_id, v_auth_user_b_id;


    -- =======================================================================
    -- STEP 3: Provision public profile rows for both users
    -- =======================================================================
    RAISE NOTICE '[SETUP] Inserting public user profiles…';

    INSERT INTO public.users (id, full_name, email, role, branch_id, is_active)
    VALUES
        (
            v_auth_user_a_id,
            'Test User Alpha',
            'user.alpha@regintel.test',
            'Employee',
            v_branch_alpha_id,
            true
        ),
        (
            v_auth_user_b_id,
            'Test User Beta',
            'user.beta@regintel.test',
            'Employee',
            v_branch_beta_id,
            true
        );

    RAISE NOTICE '[SETUP] User profiles created — Alpha branch user: %, Beta branch user: %',
        v_auth_user_a_id, v_auth_user_b_id;


    -- =======================================================================
    -- STEP 4: Provision a team inside Branch Beta (required by tasks.team_id
    --         NOT NULL constraint)
    -- =======================================================================
    RAISE NOTICE '[SETUP] Creating test team in Branch Beta…';

    INSERT INTO public.teams (id, name, branch_id, leader_id)
    VALUES (v_team_beta_id, 'Beta Compliance Team', v_branch_beta_id, v_auth_user_b_id);

    RAISE NOTICE '[SETUP] Beta team created: %', v_team_beta_id;


    -- =======================================================================
    -- STEP 5: Provision a task owned exclusively by Branch Beta
    -- =======================================================================
    RAISE NOTICE '[SETUP] Creating test task bound to Branch Beta…';

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
        v_task_beta_id,
        'Beta RBI Compliance Action Point',
        'This task must remain invisible to Branch Alpha users under BBAC.',
        v_team_beta_id,
        v_auth_user_b_id,
        v_branch_beta_id,
        'Pending',
        'Critical',
        CURRENT_DATE + INTERVAL '7 days'
    );

    RAISE NOTICE '[SETUP] Beta task created: %', v_task_beta_id;


    -- =======================================================================
    -- STEP 6: Simulate User A's authenticated Supabase session
    --
    -- auth.uid() in Supabase resolves via:
    --   (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')::uuid
    --
    -- SET LOCAL scopes the GUC override to this transaction only, ensuring
    -- no session bleed-through after ROLLBACK.
    -- =======================================================================
    RAISE NOTICE '[TEST] Injecting User A session context (branch: Alpha)…';

    PERFORM set_config(
        'request.jwt.claims',
        json_build_object(
            'sub',  v_auth_user_a_id::text,
            'role', 'authenticated'
        )::text,
        true   -- is_local = true → scoped to this transaction
    );

    RAISE NOTICE '[TEST] Session context active — auth.uid() resolves to: %', auth.uid();


    -- =======================================================================
    -- STEP 7: Execute the isolation assertion
    --
    -- Query tasks AS User A. The tasks_select_policy should restrict results
    -- to rows where branch_id = get_auth_user_branch() (Branch Alpha).
    -- The Beta task must return zero rows. Any non-zero count is a data leak.
    -- =======================================================================
    RAISE NOTICE '[TEST] Querying tasks as User A — expecting 0 rows from Branch Beta…';

    SELECT COUNT(*)
    INTO   v_leaked_count
    FROM   public.tasks
    WHERE  id = v_task_beta_id;

    -- =======================================================================
    -- STEP 8: Assert isolation — RAISE EXCEPTION on data leakage
    -- =======================================================================
    IF v_leaked_count > 0 THEN
        RAISE EXCEPTION
            '[FAIL] BRANCH ISOLATION BREACH DETECTED — '
            'User A (branch: Alpha) can read % task(s) belonging to Branch Beta. '
            'Leaking task ID: %. '
            'RLS policy "tasks_select_policy" is not enforcing branch_id isolation correctly.',
            v_leaked_count,
            v_task_beta_id;
    ELSE
        RAISE NOTICE
            '[PASS] Branch isolation verified — User A received 0 tasks from Branch Beta. '
            'tasks_select_policy is enforcing BBAC correctly.';
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        -- Surface the exact error message before the outer ROLLBACK cleans up.
        RAISE EXCEPTION '%', SQLERRM;

END;
$$;


-- =============================================================================
-- ROLLBACK — unconditionally discard all fixture data inserted above.
-- No branches, auth users, public users, teams, or tasks from this test
-- will persist in the development database after this point.
-- =============================================================================
ROLLBACK;

RAISE NOTICE '[TEARDOWN] Transaction rolled back — zero residual test data remains.';
