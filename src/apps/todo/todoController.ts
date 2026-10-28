import type { Request, Response } from "express";
import { DatabaseError } from "pg";
import { getTodos, createTodo, updateTodo, deleteTodo } from "./todoModel";

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ error: message });
}

// DB接続・サービス利用不可を503、それ以外を500にする
function handleDbError(res: Response, error: unknown): void {
  console.error("TODO APIエラー:", error);

  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String(error.code)
      : "";

  const unavailableCodes = [
    "08000",
    "08001",
    "08003",
    "08006",
    "08004",
    "08007",
    "08P01",
    "57P01",
    "57P02",
    "57P03",
  ];

  if (
    unavailableCodes.includes(code) ||
    code === "ECONNREFUSED" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN"
  ) {
    sendError(res, 503, "データベースを利用できません");
    return;
  }

  sendError(res, 500, "サーバー内部エラーが発生しました");
}

// REQ-01：一覧取得
export async function listTodos(_req: Request, res: Response) {
  try {
    const todos = await getTodos();
    res.status(200).json({ data: todos });
  } catch (error) {
    handleDbError(res, error);
  }
}

// REQ-02：新規登録
export async function addTodo(req: Request, res: Response) {
  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    sendError(res, 400, "JSONオブジェクトを送信してください");
    return;
  }

  if (typeof body.title !== "string") {
    sendError(res, 400, "titleは文字列で指定してください");
    return;
  }

  const title = body.title.trim();

  if (title.length < 1 || title.length > 100) {
    sendError(res, 422, "タイトルは1〜100文字で入力してください");
    return;
  }

  try {
    const todo = await createTodo(title);
    res.status(201).json({ data: todo });
  } catch (error) {
    handleDbError(res, error);
  }
}

// REQ-03：完了状態の部分更新
export async function changeTodo(req: Request, res: Response) {
  const rawId = String(req.params.id);
  const id = Number(rawId);

  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) {
    sendError(res, 400, "IDは1以上の整数で指定してください");
    return;
  }

  const body = req.body;

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    sendError(res, 400, "JSONオブジェクトを送信してください");
    return;
  }

  if (typeof body.isCompleted !== "boolean") {
    sendError(res, 422, "isCompletedはtrueまたはfalseで指定してください");
    return;
  }

  try {
    const todo = await updateTodo(id, body.isCompleted);

    if (!todo) {
      sendError(res, 404, "TODOが見つかりません");
      return;
    }

    res.status(200).json({ data: todo });
  } catch (error) {
    handleDbError(res, error);
  }
}

// REQ-04：削除
export async function removeTodo(req: Request, res: Response) {
  const rawId = String(req.params.id);
  const id = Number(rawId);

  if (!/^[1-9]\d*$/.test(rawId) || !Number.isSafeInteger(id)) {
    sendError(res, 400, "IDは1以上の整数で指定してください");
    return;
  }

  try {
    const deleted = await deleteTodo(id);

    if (!deleted) {
      sendError(res, 404, "TODOが見つかりません");
      return;
    }

    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
}
