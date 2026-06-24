-- =============================================================================
-- Migration: 20260620000000_init_extensions_enums
-- Project:   RegIntel by Vibeforge
-- Purpose:   Enable required PostgreSQL extensions and define all
--            application-wide enumerated types used across the schema.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------------

-- Enable uuid-ossp to allow cryptographically secure UUID generation via
-- uuid_generate_v4(), used as the default primary key strategy across all tables.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ---------------------------------------------------------------------------
-- ENUM: user_role
-- Represents the hierarchical security roles assignable to application users.
-- ---------------------------------------------------------------------------
CREATE TYPE user_role AS ENUM (
    'Employee',
    'Team Leader',
    'Branch Manager',
    'Branch Admin',
    'Auditor',
    'System Admin'
);


-- ---------------------------------------------------------------------------
-- ENUM: task_status
-- Tracks the lifecycle state of an Action Point (regulatory task).
-- ---------------------------------------------------------------------------
CREATE TYPE task_status AS ENUM (
    'Pending',
    'In Progress',
    'Completed'
);


-- ---------------------------------------------------------------------------
-- ENUM: task_priority
-- Classifies the regulatory risk level associated with an Action Point.
-- ---------------------------------------------------------------------------
CREATE TYPE task_priority AS ENUM (
    'Critical',
    'Warning',
    'Normal'
);


-- ---------------------------------------------------------------------------
-- ENUM: transfer_status
-- Manages the dual-signature workflow for branch-to-branch record transfers.
-- States progress as follows:
--   Pending_Release    → originating branch has initiated the transfer
--   Pending_Acceptance → receiving branch must accept or reject
--   Approved           → transfer completed successfully by both parties
--   Rejected           → transfer declined by the receiving branch
-- ---------------------------------------------------------------------------
CREATE TYPE transfer_status AS ENUM (
    'Pending_Release',
    'Pending_Acceptance',
    'Approved',
    'Rejected'
);
