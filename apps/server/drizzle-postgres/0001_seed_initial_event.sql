INSERT INTO "events" (
    "name",
    "season",
    "status",
    "ruleset",
    "table_count",
    "practice_matches_enabled",
    "created_at"
)
VALUES (
    'BIOGLOW Event',
    '2026-2027',
    'active',
    'BIOGLOW',
    1,
    false,
    (EXTRACT(EPOCH FROM NOW()) * 1000)::bigint
);
