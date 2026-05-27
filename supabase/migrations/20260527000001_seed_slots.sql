-- Seed: one money slot per object (idempotent — skips objects that already have a money slot)
INSERT INTO slots (object_id, slot_type, name, goal_value, unit, sort_order)
SELECT id, 'money', 'Денежный сбор', total_goal_rub, 'RUB', 1
FROM objects
WHERE total_goal_rub > 0
  AND NOT EXISTS (
    SELECT 1 FROM slots WHERE slots.object_id = objects.id AND slot_type = 'money'
  );
