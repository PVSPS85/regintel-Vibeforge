-- =============================================================================
-- Migration: 20260620000001_create_core_tables
-- Project:   RegIntel by Vibeforge
-- Purpose:   Create all base relational tables with foreign key integrity.
--            Depends on: 20260620000000_init_extensions_enums
-- =============================================================================


-- ---------------------------------------------------------------------------
-- TABLE: branches
-- Represents physical or logical organisational branches.
-- ---------------------------------------------------------------------------
CREATE TABLE branches (
    id          UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_name TEXT                     NOT NULL,
    branch_code TEXT                     NOT NULL UNIQUE,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------------
-- TABLE: users
-- Public profile table that shadows auth.users.
-- Each row is owned by a corresponding Supabase auth identity.
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id         UUID                     PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name  TEXT                     NOT NULL,
    email      TEXT                     NOT NULL UNIQUE,
    role       user_role                NOT NULL DEFAULT 'Employee',
    branch_id  UUID                     REFERENCES branches(id) ON DELETE RESTRICT,
    is_active  BOOLEAN                  NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------------
-- TABLE: teams
-- Isolated departments within a branch.
-- A team name must be unique per branch (composite UNIQUE constraint).
-- ---------------------------------------------------------------------------
CREATE TABLE teams (
    id         UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT                     NOT NULL,
    branch_id  UUID                     NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    leader_id  UUID                     REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_teams_name_branch UNIQUE (name, branch_id)
);


-- ---------------------------------------------------------------------------
-- TABLE: team_members
-- Junction table: many-to-many between teams and users.
-- ---------------------------------------------------------------------------
CREATE TABLE team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    PRIMARY KEY (team_id, user_id)
);


-- ---------------------------------------------------------------------------
-- TABLE: regulations
-- Master compliance documents uploaded by authorised users.
-- ---------------------------------------------------------------------------
CREATE TABLE regulations (
    id          UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    title       TEXT                     NOT NULL,
    file_url    TEXT                     NOT NULL,
    uploaded_by UUID                     REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------------
-- TABLE: tasks
-- Action Points derived from regulations, assigned to teams and individuals.
-- ---------------------------------------------------------------------------
CREATE TABLE tasks (
    id            UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    title         TEXT                     NOT NULL,
    description   TEXT                     NOT NULL,
    team_id       UUID                     NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    assigned_to   UUID                     REFERENCES users(id) ON DELETE SET NULL,
    branch_id     UUID                     NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    regulation_id UUID                     REFERENCES regulations(id) ON DELETE SET NULL,
    status        task_status              NOT NULL DEFAULT 'Pending',
    priority      task_priority            NOT NULL DEFAULT 'Normal',
    due_date      DATE                     NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------------
-- TABLE: chat_rooms
-- Represents both direct-message pairs and group conversations.
-- 'name' is nullable — DM rooms are identified by their participants alone.
-- ---------------------------------------------------------------------------
CREATE TABLE chat_rooms (
    id         UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       TEXT,
    is_group   BOOLEAN                  NOT NULL DEFAULT false,
    branch_id  UUID                     REFERENCES branches(id) ON DELETE CASCADE
);


-- ---------------------------------------------------------------------------
-- TABLE: chat_participants
-- Junction table: many-to-many between chat_rooms and users.
-- ---------------------------------------------------------------------------
CREATE TABLE chat_participants (
    room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    PRIMARY KEY (room_id, user_id)
);


-- ---------------------------------------------------------------------------
-- TABLE: messages
-- Individual messages posted within a chat room.
-- 'attachment_url' is nullable — not every message carries a file.
-- ---------------------------------------------------------------------------
CREATE TABLE messages (
    id             UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id        UUID                     NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_id      UUID                     REFERENCES users(id) ON DELETE SET NULL,
    message_text   TEXT                     NOT NULL,
    attachment_url TEXT,
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------------
-- TABLE: transfer_requests
-- Tracks the dual-signature branch relocation workflow for a user.
-- Both from_branch_id and to_branch_id use RESTRICT to prevent accidental
-- branch deletion while a transfer is in flight.
-- ---------------------------------------------------------------------------
CREATE TABLE transfer_requests (
    id             UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id        UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_branch_id UUID                     NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    to_branch_id   UUID                     NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
    status         transfer_status          NOT NULL DEFAULT 'Pending_Release',
    created_at     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ---------------------------------------------------------------------------
-- TABLE: audit_logs
-- Immutable append-only record of significant user actions across the system.
-- 'details' stores arbitrary JSON context (e.g. before/after diffs, metadata).
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id         UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID                     REFERENCES users(id) ON DELETE SET NULL,
    branch_id  UUID                     REFERENCES branches(id) ON DELETE SET NULL,
    action     TEXT                     NOT NULL,
    details    JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
