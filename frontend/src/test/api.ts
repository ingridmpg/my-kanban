import { vi } from "vitest";
import type { BoardData } from "@/lib/kanban";

type Reply = { status: number; body?: unknown };
type Routes = Record<string, (body: unknown) => Reply | Promise<Reply>>;

// Stubs fetch with handlers keyed by "METHOD /path". Unknown requests fail the test.
export const mockApi = (routes: Routes) => {
  const fetchMock = vi.fn(async (path: string, init?: RequestInit) => {
    const key = `${init?.method ?? "GET"} ${path}`;
    const handler = routes[key];
    if (!handler) {
      throw new Error(`Unexpected request: ${key}`);
    }
    const { status, body } = await handler(init?.body ? JSON.parse(init.body as string) : undefined);
    return new Response(body === undefined ? null : JSON.stringify(body), { status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

export const requestBodies = (fetchMock: ReturnType<typeof mockApi>, key: string) =>
  fetchMock.mock.calls
    .filter(([path, init]) => `${init?.method ?? "GET"} ${path}` === key)
    .map(([, init]) => JSON.parse(init!.body as string));

export const testBoard: BoardData = {
  columns: [
    { id: "col-backlog", title: "Backlog", cardIds: ["card-1", "card-2"] },
    { id: "col-to-do", title: "To Do", cardIds: [] },
    { id: "col-progress", title: "In Progress", cardIds: [] },
    { id: "col-review", title: "Review", cardIds: [] },
    { id: "col-done", title: "Done", cardIds: [] },
  ],
  cards: {
    "card-1": { id: "card-1", title: "First card", details: "First details" },
    "card-2": { id: "card-2", title: "Second card", details: "" },
  },
};
