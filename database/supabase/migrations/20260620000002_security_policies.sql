-- =============================================================================
-- Migration: 20260620000002_security_policies
-- Project:   RegIntel by Vibeforge
-- Purpose:   Define SECURITY DEFINER helper functions, enable Row-Level Security
--            (RLS) on all sensitive tables, and implement Branch-Based Access
--            Control (BBAC) policies across the schema.
--            Depends on: 20260620000001_create_core_tables
-- =============================================================================


-- ---------------------------------------------------------------------------
-- HELPER FUNCTIONS
-- SECURITY DEFINER ensures these run with the privileges of the definer,
-- not the caller, preventing privilege escalation through direct table reads.
-- ---------------------------------------------------------------------------

-- Returns the branch_id of the currently authenticated user.
CREATE OR REPLACE FUNCTION get_auth_user_branch()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT branch_id
    FROM   public.users
    WHERE  id = auth.uid();
$$;

-- Returns the role of the currently authenticated user.
CREATE OR REPLACE FUNCTION get_auth_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT role
    FROM   public.users
    WHERE  id = auth.uid();
$$;


-- ---------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- RLS must be explicitly activated per table before any policies take effect.
-- ---------------------------------------------------------------------------
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_rooms         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_participants  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_requests  ENABLE ROW LEVEL SECURITY;


-- ===========================================================================
-- RLS POLICIES: users
-- ===========================================================================

-- SELECT: visible within same branch, or globally to Auditors and System Admins.
CREATE POLICY "users_select_policy"
ON public.users
FOR SELECT
USING (
    branch_id = get_auth_user_branch()
    OR get_auth_user_role() IN ('Auditor', 'System Admin')
);

-- UPDATE: own record, or by Branch Admin / Branch Manager / System Admin.
CREATE POLICY "users_update_policy"
ON public.users
FOR UPDATE
USING (
    id = auth.uid()
    OR get_auth_user_role() IN ('Branch Admin', 'Branch Manager', 'System Admin')
);


-- ===========================================================================
-- RLS POLICIES: tasks
-- ===========================================================================

-- SELECT: same-branch tasks, or global access for Auditors and System Admins.
CREATE POLICY "tasks_select_policy"
ON public.tasks
FOR SELECT
USING (
    branch_id = get_auth_user_branch()
    OR get_auth_user_role() IN ('Auditor', 'System Admin')
);

-- INSERT: authorised roles within their own branch only.
CREATE POLICY "tasks_insert_policy"
ON public.tasks
FOR INSERT
WITH CHECK (
    branch_id = get_auth_user_branch()
    AND get_auth_user_role() IN ('Team Leader', 'Branch Manager', 'Branch Admin', 'System Admin')
);

-- UPDATE: authorised roles within their own branch only.
CREATE POLICY "tasks_update_policy"
ON public.tasks
FOR UPDATE
USING (
    branch_id = get_auth_user_branch()
    AND get_auth_user_role() IN ('Team Leader', 'Branch Manager', 'Branch Admin', 'System Admin')
);

-- DELETE: authorised roles within their own branch only.
CREATE POLICY "tasks_delete_policy"
ON public.tasks
FOR DELETE
USING (
    branch_id = get_auth_user_branch()
    AND get_auth_user_role() IN ('Team Leader', 'Branch Manager', 'Branch Admin', 'System Admin')
);


-- ===========================================================================
-- RLS POLICIES: chat_rooms
-- ===========================================================================

-- SELECT: only rooms the authenticated user is a participant of.
CREATE POLICY "chat_rooms_select_policy"
ON public.chat_rooms
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM   public.chat_participants cp
        WHERE  cp.room_id = id
        AND    cp.user_id = auth.uid()
    )
);

-- INSERT: only if the creating user is registering themselves as a participant.
-- (Room creation should always be paired with a chat_participants insert.)
CREATE POLICY "chat_rooms_insert_policy"
ON public.chat_rooms
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM   public.chat_participants cp
        WHERE  cp.room_id = id
        AND    cp.user_id = auth.uid()
    )
);


-- ===========================================================================
-- RLS POLICIES: messages
-- ===========================================================================

-- SELECT: only messages in rooms the authenticated user participates in.
CREATE POLICY "messages_select_policy"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM   public.chat_participants cp
        WHERE  cp.room_id = messages.room_id
        AND    cp.user_id = auth.uid()
    )
);

-- INSERT: only into rooms the authenticated user participates in.
CREATE POLICY "messages_insert_policy"
ON public.messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM   public.chat_participants cp
        WHERE  cp.room_id = messages.room_id
        AND    cp.user_id = auth.uid()
    )
);


-- ===========================================================================
-- RLS POLICIES: transfer_requests
-- ===========================================================================

-- SELECT: own transfer requests, or Branch Managers/Admins of either branch
-- involved in the transfer (originating or receiving).
CREATE POLICY "transfer_requests_select_policy"
ON public.transfer_requests
FOR SELECT
USING (
    -- The user whose relocation is being requested
    user_id = auth.uid()

    -- Branch Manager or Branch Admin of the originating branch
    OR (
        get_auth_user_role() IN ('Branch Manager', 'Branch Admin')
        AND from_branch_id = get_auth_user_branch()
    )

    -- Branch Manager or Branch Admin of the receiving branch
    OR (
        get_auth_user_role() IN ('Branch Manager', 'Branch Admin')
        AND to_branch_id = get_auth_user_branch()
    )
);
