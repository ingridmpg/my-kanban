import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthForm } from "@/components/AuthForm";
import { mockApi, requestBodies } from "@/test/api";

const fillAndSubmit = async (username: string, password: string) => {
  await userEvent.type(screen.getByLabelText("Username"), username);
  await userEvent.type(screen.getByLabelText("Password"), password);
  await userEvent.click(screen.getByRole("button", { name: /^(sign in|create account)$/i }));
};

const switchToCreateAccount = () =>
  userEvent.click(screen.getByRole("button", { name: /new here/i }));

describe("AuthForm", () => {
  it("signs in with the submitted credentials", async () => {
    const fetchMock = mockApi({
      "POST /api/login": () => ({ status: 200, body: { username: "user" } }),
    });
    const onSignedIn = vi.fn();
    render(<AuthForm onSignedIn={onSignedIn} />);

    await fillAndSubmit("user", "password");

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith("user"));
    expect(requestBodies(fetchMock, "POST /api/login")).toEqual([
      { username: "user", password: "password" },
    ]);
  });

  it("shows the error on bad credentials", async () => {
    mockApi({
      "POST /api/login": () => ({
        status: 401,
        body: { detail: "Invalid username or password" },
      }),
    });
    const onSignedIn = vi.fn();
    render(<AuthForm onSignedIn={onSignedIn} />);

    await fillAndSubmit("user", "wrong-password");

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid username or password");
    expect(onSignedIn).not.toHaveBeenCalled();
  });

  it("creates an account", async () => {
    const fetchMock = mockApi({
      "POST /api/register": () => ({ status: 201, body: { username: "ingrid" } }),
    });
    const onSignedIn = vi.fn();
    render(<AuthForm onSignedIn={onSignedIn} />);

    await switchToCreateAccount();
    await fillAndSubmit("ingrid", "secret-pass");

    await waitFor(() => expect(onSignedIn).toHaveBeenCalledWith("ingrid"));
    expect(requestBodies(fetchMock, "POST /api/register")).toEqual([
      { username: "ingrid", password: "secret-pass" },
    ]);
  });

  it("shows the error when the username is taken", async () => {
    mockApi({
      "POST /api/register": () => ({ status: 409, body: { detail: "Username already taken" } }),
    });
    render(<AuthForm onSignedIn={vi.fn()} />);

    await switchToCreateAccount();
    await fillAndSubmit("user", "secret-pass");

    expect(await screen.findByRole("alert")).toHaveTextContent("Username already taken");
  });

  it("explains the rules when the account is invalid", async () => {
    mockApi({
      "POST /api/register": () => ({ status: 422, body: { detail: [{ msg: "too short" }] } }),
    });
    render(<AuthForm onSignedIn={vi.fn()} />);

    await switchToCreateAccount();
    await fillAndSubmit("ingrid", "short");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /password at least 8 characters/i
    );
  });
});
