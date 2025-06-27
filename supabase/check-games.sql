-- Check if games exist and their current state
SELECT 
    g.id,
    g.code,
    g.status,
    g.host_user_id,
    g.question_set_id,
    g.created_at,
    qs.name as question_set_name,
    COUNT(DISTINCT gp.id) as participant_count
FROM games g
LEFT JOIN question_sets qs ON g.question_set_id = qs.id
LEFT JOIN game_participants gp ON g.id = gp.game_id
GROUP BY g.id, g.code, g.status, g.host_user_id, g.question_set_id, g.created_at, qs.name
ORDER BY g.created_at DESC
LIMIT 10;

-- Check if there are any question sets with questions
SELECT 
    qs.id,
    qs.name,
    qs.difficulty,
    COUNT(q.id) as question_count
FROM question_sets qs
LEFT JOIN questions q ON qs.id = q.question_set_id
GROUP BY qs.id, qs.name, qs.difficulty
ORDER BY question_count DESC
LIMIT 10;