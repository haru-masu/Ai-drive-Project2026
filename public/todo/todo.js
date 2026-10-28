// TODO APIとの通信をまとめるクラス
class TodoApi {
  constructor(baseUrl = "/api/v1/todos") {
    this.baseUrl = baseUrl;
  }

  async request(path = "", options = {}) {
    const response = await fetch(this.baseUrl + path, options);

    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw new Error(result.error || "通信に失敗しました");
    }

    if (response.status === 204) {
      return null;
    }

    const result = await response.json();
    return result.data;
  }

  getTodos() {
    return this.request();
  }

  createTodo(title) {
    return this.request("", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
  }

  updateTodo(id, isCompleted) {
    return this.request(`/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isCompleted }),
    });
  }

  deleteTodo(id) {
    return this.request(`/${id}`, {
      method: "DELETE",
    });
  }
}

const api = new TodoApi();

const form = document.getElementById("todo-form");
const titleInput = document.getElementById("todo-title");
const list = document.getElementById("todo-list");
const message = document.getElementById("message");

function showError(error) {
  message.textContent =
    error instanceof Error ? error.message : "エラーが発生しました";
}

// TODO一覧を画面に表示
async function loadTodos() {
  try {
    message.textContent = "";

    const todos = await api.getTodos();
    list.replaceChildren();

    if (todos.length === 0) {
      const li = document.createElement("li");
      li.textContent = "TODOがありません";
      list.append(li);
      return;
    }

    for (const todo of todos) {
      const li = document.createElement("li");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = todo.isCompleted;

      const title = document.createElement("span");
      title.textContent = todo.title;

      if (todo.isCompleted) {
        title.classList.add("completed");
      }

      checkbox.addEventListener("change", async () => {
        checkbox.disabled = true;

        try {
          await api.updateTodo(todo.id, checkbox.checked);
          await loadTodos();
        } catch (error) {
          checkbox.checked = !checkbox.checked;
          showError(error);
        } finally {
          checkbox.disabled = false;
        }
      });

      const deleteButton = document.createElement("button");
      deleteButton.textContent = "削除";

      deleteButton.addEventListener("click", async () => {
        deleteButton.disabled = true;

        try {
          await api.deleteTodo(todo.id);
          await loadTodos();
        } catch (error) {
          showError(error);
          deleteButton.disabled = false;
        }
      });

      li.append(checkbox, title, deleteButton);
      list.append(li);
    }
  } catch (error) {
    showError(error);
  }
}

// TODOを新規登録
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();

  if (title.length < 1 || title.length > 100) {
    message.textContent = "タイトルは1〜100文字で入力してください";
    return;
  }

  try {
    await api.createTodo(title);
    titleInput.value = "";
    await loadTodos();
  } catch (error) {
    showError(error);
  }
});

// 初回読み込み
loadTodos();
