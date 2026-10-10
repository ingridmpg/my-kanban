import type { BoardData } from "@/lib/kanban";

export type User = { username: string };

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
  const response = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    // FastAPI errors carry a string detail, or a list of field errors for 422.
    const { detail } = await response.json();
    throw new ApiError(response.status, typeof detail === "string" ? detail : "Invalid request");
  }
  return response.status === 204 ? (undefined as T) : response.json();
};

export const api = {
  me: () => request<User>("GET", "/api/me"),
  login: (username: string, password: string) =>
    request<User>("POST", "/api/login", { username, password }),
  register: (username: string, password: string) =>
    request<User>("POST", "/api/register", { username, password }),
  logout: () => request<void>("POST", "/api/logout"),
  getBoard: () => request<BoardData>("GET", "/api/board"),
  saveBoard: (board: BoardData) => request<BoardData>("PUT", "/api/board", board),
};
