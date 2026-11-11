import { pool } from "../../../db";

export type Todo = {
  id: number;
  title: string;
  isCompleted: boolean;
  createdAt: Date;
};

// DBのsnake_caseをJSON用camelCaseに変換
const TODO_COLUMNS = `
  id,
  title,
  is_completed AS "isCompleted",
  created_at AS "createdAt"
`;

// REQ-01：TODO一覧取得
export async function getTodos(): Promise<Todo[]> {
  const result = await pool.query<Todo>(
    `SELECT ${TODO_COLUMNS}
     FROM todo_tasks
     ORDER BY id DESC`,
  );
  return result.rows;
}

// REQ-02：TODO新規登録
export async function createTodo(title: string): Promise<Todo> {
  const result = await pool.query<Todo>(
    `INSERT INTO todo_tasks (title)
     VALUES ($1)
     RETURNING ${TODO_COLUMNS}`,
    [title],
  );
  return result.rows[0];
}

// REQ-03：完了状態の部分更新
export async function updateTodo(
  id: number,
  isCompleted: boolean,
): Promise<Todo | null> {
  const result = await pool.query<Todo>(
    `UPDATE todo_tasks
     SET is_completed = $1
     WHERE id = $2
     RETURNING ${TODO_COLUMNS}`,
    [isCompleted, id],
  );
  return result.rows[0] ?? null;
}

// REQ-04：TODO削除
export async function deleteTodo(id: number): Promise<boolean> {
  const result = await pool.query(
    "DELETE FROM todo_tasks WHERE id = $1 RETURNING id",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
