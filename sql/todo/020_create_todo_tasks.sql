
-- TODOアプリ V1 テーブル作成

CREATE TABLE IF NOT EXISTS todo_tasks (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title TEXT NOT NULL CHECK (
        char_length(btrim(title)) BETWEEN 1 AND 100
    ),
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- テーブル構造の確認
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'todo_tasks'
ORDER BY ordinal_position;
