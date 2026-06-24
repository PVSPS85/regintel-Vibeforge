-- =============================================================================
-- Migration: 20260620000005_performance_indexes
-- Project:   RegIntel by Vibeforge
-- Purpose:   Define targeted B-Tree indexes to accelerate high-frequency query
--            patterns across personnel lookups, task dashboards, chat history,
--            and audit analytics.
--            Depends on: 20260620000001_create_core_tables
-- =============================================================================


-- ---------------------------------------------------------------------------
-- INDEX: idx_users_branch_lookup
-- Table:  public.users
-- Type:   B-Tree composite (branch_id, is_active)
--
-- Optimises personnel directory queries that filter staff by branch and active
-- status — the most frequent access pattern for role routing and access checks.
-- Covering both columns in one index avoids a separate filter pass after the
-- branch_id range scan.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_branch_lookup
ON public.users USING BTREE (branch_id, is_active);


-- ---------------------------------------------------------------------------
-- INDEX: idx_users_email_hash
-- Table:  public.users
-- Type:   B-Tree (email)
--
-- Accelerates single-row authentication lookups by email address at login time.
-- B-Tree is chosen here for exact-match equality — the dominant pattern for
-- credential resolution — and also supports LIKE 'prefix%' searches if needed
-- in future admin user-search features.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_users_email_hash
ON public.users USING BTREE (email);


-- ---------------------------------------------------------------------------
-- INDEX: idx_tasks_branch_team_composite
-- Table:  public.tasks
-- Type:   B-Tree composite (branch_id, team_id)
--
-- Accelerates team Kanban workspace queries that scope tasks by branch first
-- (enforced by BBAC) and then narrow to a specific team. The column order
-- (branch_id leading) aligns with the RLS predicate so the planner can use
-- this index for both the security filter and the team grouping in one pass.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_tasks_branch_team_composite
ON public.tasks USING BTREE (branch_id, team_id);


-- ---------------------------------------------------------------------------
-- INDEX: idx_tasks_delivery_deadline
-- Table:  public.tasks
-- Type:   B-Tree partial (due_date ASC) WHERE status != 'Completed'
--
-- A filtered partial index covering only active, incomplete tasks. This keeps
-- the index structure small and highly selective — the compliance deadline
-- monitor never needs to scan completed records — while providing fast
-- ASC-ordered delivery for upcoming due-date dashboards and alert systems.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_tasks_delivery_deadline
ON public.tasks USING BTREE (due_date ASC)
WHERE status != 'Completed';


-- ---------------------------------------------------------------------------
-- INDEX: idx_messages_chronological_feed
-- Table:  public.messages
-- Type:   B-Tree composite (room_id, created_at DESC)
--
-- Maximises chat room history retrieval performance. Queries always scope by
-- room_id first and then return messages in reverse-chronological order
-- (newest first), which maps directly to this index's column order and sort
-- direction — enabling index-only scans without an additional sort step.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_messages_chronological_feed
ON public.messages USING BTREE (room_id, created_at DESC);


-- ---------------------------------------------------------------------------
-- INDEX: idx_audit_logs_metric_analysis
-- Table:  public.audit_logs
-- Type:   B-Tree composite (branch_id, created_at DESC)
--
-- Speeds up inspector and compliance dashboard queries that aggregate or page
-- through audit events scoped to a specific branch in reverse-chronological
-- order. Placing branch_id as the leading column aligns with the BBAC filter
-- that all Auditor queries carry, making this index immediately selective.
-- ---------------------------------------------------------------------------
CREATE INDEX idx_audit_logs_metric_analysis
ON public.audit_logs USING BTREE (branch_id, created_at DESC);
