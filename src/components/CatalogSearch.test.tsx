import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SEARCH_PLACEHOLDER } from "../review/locks";
import { CatalogSearch } from "./CatalogSearch";

describe("CatalogSearch", () => {
  it("does not show a clear control when the field is empty", () => {
    render(<CatalogSearch value="" onValueChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();
    expect(screen.getByTestId("search-clear-slot")).toBeInTheDocument();
  });

  it("keeps the clear slot reserved so typing does not shrink the field", () => {
    const { rerender } = render(<CatalogSearch value="" onValueChange={vi.fn()} />);
    expect(screen.getByTestId("search-clear-slot")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear search" })).toBeNull();

    rerender(<CatalogSearch value="coke" onValueChange={vi.fn()} />);
    expect(screen.getByTestId("search-clear-slot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear search" })).toBeInTheDocument();
  });

  it("clears from the X button", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CatalogSearch value="coke" onValueChange={onValueChange} />);

    await user.click(screen.getByRole("button", { name: "Clear search" }));
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("clears on Escape", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CatalogSearch value="coke" onValueChange={onValueChange} />);

    screen.getByLabelText("Search catalog").focus();
    await user.keyboard("{Escape}");
    expect(onValueChange).toHaveBeenCalledWith("");
  });

  it("does not clear on Escape when the field is already empty", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CatalogSearch value="" onValueChange={onValueChange} />);

    screen.getByLabelText("Search catalog").focus();
    await user.keyboard("{Escape}");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("names the fields the API search actually covers", () => {
    render(<CatalogSearch value="" onValueChange={vi.fn()} />);
    expect(screen.getByLabelText("Search catalog")).toHaveAttribute(
      "placeholder",
      SEARCH_PLACEHOLDER,
    );
  });

  it("does not open an autocomplete overlay", () => {
    render(<CatalogSearch value="coke" onValueChange={vi.fn()} />);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("forwards typed value to the list", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<CatalogSearch value="" onValueChange={onValueChange} />);
    await user.type(screen.getByLabelText("Search catalog"), "c");
    expect(onValueChange).toHaveBeenCalledWith("c");
  });
});
