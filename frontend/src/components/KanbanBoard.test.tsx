import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { mockApi, requestBodies, testBoard } from "@/test/api";

const renderBoard = async ({ saveStatus = 200 } = {}) => {
  const fetchMock = mockApi({
    "GET /api/board": () => ({ status: 200, body: testBoard }),
    "PUT /api/board": (body) => ({ status: saveStatus, body }),
    "POST /api/logout": () => ({ status: 204 }),
  });
  const onSignedOut = vi.fn();
  render(<KanbanBoard username="ingrid" onSignedOut={onSignedOut} />);
  await screen.findAllByTestId(/column-/i);
  return { fetchMock, onSignedOut, saves: () => requestBodies(fetchMock, "PUT /api/board") };
};

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];
const getCard = () => screen.getByTestId("card-card-1");

describe("KanbanBoard", () => {
  it("renders the board from the API", async () => {
    await renderBoard();
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
    expect(within(getCard()).getByText("First card")).toBeInTheDocument();
    expect(screen.getByText("ingrid")).toBeInTheDocument();
  });

  it("saves a column rename on blur, not while typing", async () => {
    const { saves } = await renderBoard();
    const input = within(getFirstColumn()).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "Ideas");
    expect(saves()).toHaveLength(0);

    await userEvent.tab();
    await waitFor(() => expect(saves()).toHaveLength(1));
    expect(saves()[0].columns[0].title).toBe("Ideas");
  });

  it("reverts an empty column title without saving", async () => {
    const { saves } = await renderBoard();
    const input = within(getFirstColumn()).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.tab();
    expect(input).toHaveValue("Backlog");
    expect(saves()).toHaveLength(0);
  });

  it("adds a card and saves it", async () => {
    const { saves } = await renderBoard();
    const column = getFirstColumn();
    await userEvent.click(within(column).getByRole("button", { name: /add a card/i }));
    await userEvent.type(within(column).getByPlaceholderText(/card title/i), "New card");
    await userEvent.type(within(column).getByPlaceholderText(/details/i), "Notes");
    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();
    await waitFor(() => expect(saves()).toHaveLength(1));
    const saved = saves()[0];
    const newId = saved.columns[0].cardIds[0]; // new cards go on top, where the form is
    expect(saved.cards[newId]).toEqual({ id: newId, title: "New card", details: "Notes" });
    expect(saved.columns[0].cardIds.slice(1)).toEqual(["card-1", "card-2"]);
  });

  it("removes a card and saves it", async () => {
    const { saves } = await renderBoard();
    await userEvent.click(within(getCard()).getByRole("button", { name: "Delete First card" }));

    expect(screen.queryByText("First card")).not.toBeInTheDocument();
    await waitFor(() => expect(saves()).toHaveLength(1));
    expect(saves()[0].columns[0].cardIds).toEqual(["card-2"]);
    expect(saves()[0].cards["card-1"]).toBeUndefined();
  });

  it("shows an error when a save fails", async () => {
    await renderBoard({ saveStatus: 500 });
    await userEvent.click(within(getCard()).getByRole("button", { name: "Delete First card" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not be saved/i);
  });

  it("logs out", async () => {
    const { fetchMock, onSignedOut } = await renderBoard();
    await userEvent.click(screen.getByRole("button", { name: /log out/i }));
    await waitFor(() => expect(onSignedOut).toHaveBeenCalled());
    expect(fetchMock).toHaveBeenCalledWith("/api/logout", expect.objectContaining({ method: "POST" }));
  });

  describe("editing a card", () => {
    const openEditForm = async () => {
      const result = await renderBoard();
      await userEvent.click(within(getCard()).getByRole("button", { name: "Edit First card" }));
      return {
        ...result,
        titleInput: within(getCard()).getByLabelText("Card title"),
        detailsInput: within(getCard()).getByLabelText("Card details"),
      };
    };

    it("saves the new title and details", async () => {
      const { titleInput, detailsInput, saves } = await openEditForm();
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Edited title");
      await userEvent.clear(detailsInput);
      await userEvent.type(detailsInput, "Edited details");
      await userEvent.click(within(getCard()).getByRole("button", { name: "Save" }));

      expect(within(getCard()).getByText("Edited title")).toBeInTheDocument();
      expect(within(getCard()).getByText("Edited details")).toBeInTheDocument();
      await waitFor(() => expect(saves()).toHaveLength(1));
      expect(saves()[0].cards["card-1"]).toEqual({
        id: "card-1",
        title: "Edited title",
        details: "Edited details",
      });
    });

    it("leaves the card unchanged on cancel", async () => {
      const { titleInput, saves } = await openEditForm();
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Discarded");
      await userEvent.click(within(getCard()).getByRole("button", { name: "Cancel" }));

      expect(within(getCard()).getByText("First card")).toBeInTheDocument();
      expect(screen.queryByText("Discarded")).not.toBeInTheDocument();
      expect(saves()).toHaveLength(0);
    });

    it("does not save an empty title", async () => {
      const { titleInput, saves } = await openEditForm();
      await userEvent.clear(titleInput);
      await userEvent.click(within(getCard()).getByRole("button", { name: "Save" }));

      expect(within(getCard()).getByLabelText("Card title")).toBeInTheDocument();
      expect(saves()).toHaveLength(0);
    });
  });

  it("opens the edit form of a card without details with empty details", async () => {
    await renderBoard();
    const card = screen.getByTestId("card-card-2");
    await userEvent.click(within(card).getByRole("button", { name: "Edit Second card" }));
    expect(within(card).getByLabelText("Card details")).toHaveValue("");
  });
});
