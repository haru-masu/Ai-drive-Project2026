import express, { Request, Response } from "express";
import path from "path";
import { pool } from "./db";
import todoRouter from "./src/apps/todo/todoRouter";

const app = express();
const port: number = 3000;

// ミドルウェア設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

// EJS設定
app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "views"));

// TODOアプリのAPIルーター
app.use("/api/v1/todos", todoRouter);

// トップページ
app.get("/", (_req: Request, res: Response): void => {
  res.render("index");
});

// TODOアプリの画面
app.get("/todo", (_req: Request, res: Response): void => {
  res.render("todo/index");
});

// Neonデータベース接続確認API
app.get("/api/db-check", async (_req, res) => {
  try {
    const result = await pool.query("SELECT 1 AS connection_test");

    res.json({
      status: "ok",
      database: result.rows[0].connection_test === 1 ? "connected" : "error",
    });
  } catch (error) {
    console.error("DB接続確認に失敗しました", error);

    res.status(503).json({
      status: "error",
      database: "unavailable",
    });
  }
});

// 商品データの型
type Product = {
  id: number;
  name: string;
  price: number;
};

// 商品一覧ページ
app.get("/db-sample", async (_req, res) => {
  try {
    const result = await pool.query<Product>(
      "SELECT id, name, price FROM products ORDER BY id",
    );

    res.render("db-sample", {
      products: result.rows,
    });
  } catch (error) {
    console.error("商品一覧の取得に失敗しました", error);

    res.status(503).send("商品一覧を表示できません");
  }
});

// サーバー起動
app.listen(port, (): void => {
  console.log(`Server started: http://localhost:${port}`);
});
