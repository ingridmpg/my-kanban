import { api, ApiError } from "@/lib/api";

describe("api", () => {
  it("raises an ApiError with the status when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>Bad Gateway</html>", { status: 502 }))
    );
    const error = await api.getBoard().catch((err) => err);
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(502);
    expect(error.message).toBe("Request failed (502)");
  });
});
