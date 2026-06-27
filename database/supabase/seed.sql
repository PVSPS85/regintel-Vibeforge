-- =============================================================================
-- Seed: seed.sql
-- Project:   RegIntel by Vibeforge
-- Purpose:   Insert fixed master branch records for development and testing.
--            UUIDs are hardcoded so IDs remain stable across database resets.
--            Safe to re-run: ON CONFLICT DO NOTHING prevents duplicate errors.
-- =============================================================================


-- ---------------------------------------------------------------------------
-- SEED: branches
-- 10 predefined banking branch records with static UUIDs and branch codes.
-- ---------------------------------------------------------------------------
INSERT INTO branches (id, name, code, created_at)
VALUES
    (
        '11111111-1111-1111-1111-111111111111',
        'Mumbai Corporate Head Office',
        'BR-MUM-001',
        CURRENT_TIMESTAMP
    ),
    (
        '22222222-2222-2222-2222-222222222222',
        'Bengaluru Tech & Innovation Hub',
        'BR-BLR-002',
        CURRENT_TIMESTAMP
    ),
    (
        '33333333-3333-3333-3333-333333333333',
        'New Delhi Regional Centre',
        'BR-DEL-003',
        CURRENT_TIMESTAMP
    ),
    (
        '44444444-4444-4444-4444-444444444444',
        'Chennai Operations Base',
        'BR-CHN-004',
        CURRENT_TIMESTAMP
    ),
    (
        '55555555-5555-5555-5555-555555555555',
        'Kolkata Retail Clearing Division',
        'BR-KOL-005',
        CURRENT_TIMESTAMP
    ),
    (
        '66666666-6666-6666-6666-666666666666',
        'Hyderabad Risk Management Unit',
        'BR-HYD-006',
        CURRENT_TIMESTAMP
    ),
    (
        '77777777-7777-7777-7777-777777777777',
        'Ahmedabad Treasury & Markets',
        'BR-AMD-007',
        CURRENT_TIMESTAMP
    ),
    (
        '88888888-8888-8888-8888-888888888888',
        'Pune Rural Outreach Branch',
        'BR-PUN-008',
        CURRENT_TIMESTAMP
    ),
    (
        '99999999-9999-9999-9999-999999999999',
        'Jaipur Currency Chest',
        'BR-JAI-009',
        CURRENT_TIMESTAMP
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        'Kochi NRI Banking Division',
        'BR-KOC-010',
        CURRENT_TIMESTAMP
    )
ON CONFLICT (code) DO NOTHING;
