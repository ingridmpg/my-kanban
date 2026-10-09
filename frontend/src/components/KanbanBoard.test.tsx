import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { initialData } from "@/lib/kanban";

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

describe("KanbanBoard", () => {
  it("renders five columns", () => {
    render(<KanbanBoard />);
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
  });

  it("renames a column", async () => {
    render(<KanbanBoard />);
    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /add a card/i,
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /add card/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });

  describe("editing a card", () => {
    const { title, details } = initialData.cards["card-1"];
    const getCard = () => screen.getByTestId("card-card-1");

    const openEditForm = async () => {
      render(<KanbanBoard />);
      await userEvent.click(
        within(getCard()).getByRole("button", { name: `Edit ${title}` })
      );
      return {
        titleInput: within(getCard()).getByLabelText("Card title"),
        detailsInput: within(getCard()).getByLabelText("Card details"),
      };
    };

    it("saves the new title and details", async () => {
      const { titleInput, detailsInput } = await openEditForm();
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Edited title");
      await userEvent.clear(detailsInput);
      await userEvent.type(detailsInput, "Edited details");
      await userEvent.click(within(getCard()).getByRole("button", { name: "Save" }));

      expect(within(getCard()).getByText("Edited title")).toBeInTheDocument();
      expect(within(getCard()).getByText("Edited details")).toBeInTheDocument();
    });

    it("leaves the card unchanged on cancel", async () => {
      const { titleInput } = await openEditForm();
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, "Discarded");
      await userEvent.click(within(getCard()).getByRole("button", { name: "Cancel" }));

      expect(within(getCard()).getByText(title)).toBeInTheDocument();
      expect(within(getCard()).getByText(details)).toBeInTheDocument();
      expect(screen.queryByText("Discarded")).not.toBeInTheDocument();
    });

    it("does not save an empty title", async () => {
      const { titleInput } = await openEditForm();
      await userEvent.clear(titleInput);
      await userEvent.click(within(getCard()).getByRole("button", { name: "Save" }));

      expect(within(getCard()).getByLabelText("Card title")).toBeInTheDocument();
      await userEvent.click(within(getCard()).getByRole("button", { name: "Cancel" }));
      expect(within(getCard()).getByText(title)).toBeInTheDocument();
    });
  });
});
