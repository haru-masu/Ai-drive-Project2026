import { Router } from "express";
import { listTodos, addTodo, changeTodo, removeTodo } from "./todoController";

const todoRouter = Router();

todoRouter.get("/", listTodos);
todoRouter.post("/", addTodo);
todoRouter.patch("/:id", changeTodo);
todoRouter.delete("/:id", removeTodo);

export default todoRouter;
