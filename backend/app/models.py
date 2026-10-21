from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=50)]


class Credentials(BaseModel):
    username: Username
    password: str


class NewAccount(BaseModel):
    username: Username
    password: Annotated[str, Field(min_length=8)]


class User(BaseModel):
    username: str


class Card(BaseModel):
    id: str
    title: Annotated[str, Field(min_length=1)]
    details: str


class Column(BaseModel):
    id: str
    title: str
    card_ids: list[str] = Field(alias="cardIds")


class Board(BaseModel):
    """Same shape as BoardData in frontend/src/lib/kanban.ts."""

    columns: list[Column]
    cards: dict[str, Card]


def check_board_update(current: Board, new: Board) -> None:
    """Raise ValueError if `new` is not a consistent update of `current`."""
    if [c.id for c in new.columns] != [c.id for c in current.columns]:
        raise ValueError("Columns are fixed: they cannot be added, removed or reordered")
    if any(key != card.id for key, card in new.cards.items()):
        raise ValueError("Each card must be stored under its own id")
    placed = [card_id for column in new.columns for card_id in column.card_ids]
    if len(placed) != len(set(placed)) or set(placed) != set(new.cards):
        raise ValueError("Every card must be in exactly one column")
