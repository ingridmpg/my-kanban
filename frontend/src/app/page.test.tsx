import { render, screen } from "@testing-library/react";
import Home from "@/app/page";
import { mockApi, testBoard } from "@/test/api";

describe("Home", () => {
  it("shows the sign in screen when not signed in", async () => {
    mockApi({
      "GET /api/me": () => ({ status: 401, body: { detail: "Not signed in" } }),
    });
    render(<Home />);
    expect(await screen.findByRole("button", { name: "Sign in" })).toBeInTheDocument();
  });

  it("shows the board when signed in", async () => {
    mockApi({
      "GET /api/me": () => ({ status: 200, body: { username: "user" } }),
      "GET /api/board": () => ({ status: 200, body: testBoard }),
    });
    render(<Home />);
    expect(await screen.findAllByTestId(/column-/i)).toHaveLength(5);
  });
});
