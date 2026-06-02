-- Включаем Realtime для таблицы user_quests.
-- postgres_changes подписки в браузере требуют, чтобы таблица была
-- добавлена в supabase_realtime publication.
ALTER PUBLICATION supabase_realtime ADD TABLE user_quests;
