-- =============================================================================
-- Migration: 20260620000004_realtime_channels
-- Project:   RegIntel by Vibeforge
-- Purpose:   Configure Supabase Realtime replication publication to enable
--            live Change Data Capture (CDC) on core transactional tables.
--            Depends on: 20260620000001_create_core_tables
-- =============================================================================


-- ---------------------------------------------------------------------------
-- CLEANUP
-- Safely drop any pre-existing publication with this name before recreating
-- it so that this migration is idempotent and safe to re-run during resets.
-- ---------------------------------------------------------------------------
DROP PUBLICATION IF EXISTS regintel_realtime_publication;


-- ---------------------------------------------------------------------------
-- PUBLICATION: regintel_realtime_publication
--
-- Registers a PostgreSQL logical replication publication that Supabase
-- Realtime subscribes to for broadcasting row-level change events.
--
-- Tables registered and their CDC use cases:
--
--   public.messages
--     → Instantaneous delivery of peer-to-peer and group workspace messages
--       to connected clients without polling.
--
--   public.tasks
--     → Live Kanban board card updates and task progress indicator refreshes
--       as status, priority, or assignment fields are mutated.
--
--   public.transfer_requests
--     → Real-time pipeline status updates during the dual-signature branch
--       relocation workflow (Pending_Release → Pending_Acceptance → Approved
--       / Rejected), enabling both branch parties to see transitions instantly.
--
--   public.users
--     → Immediate propagation of account status changes (e.g. is_active flag
--       toggles, role promotions, branch reassignments) to all listening clients.
-- ---------------------------------------------------------------------------
CREATE PUBLICATION regintel_realtime_publication
FOR TABLE
    public.messages,
    public.tasks,
    public.transfer_requests,
    public.users;
