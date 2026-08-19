import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConnectionBanner } from "./ConnectionBanner";

describe("ConnectionBanner", () => {
  it("stays out of the way while a healthy search is fetching", () => {
    const { container } = render(
      <ConnectionBanner
        online
        isError={false}
        isFetching
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText("Refreshing…")).toBeNull();
  });

  it("stays out of the way when the catalog is healthy", () => {
    const { container } = render(
      <ConnectionBanner
        online
        isError={false}
        isFetching={false}
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("keeps last-good data copy when offline", () => {
    render(
      <ConnectionBanner
        online={false}
        isError
        isFetching={false}
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText("You're offline. Showing the last catalog we loaded."),
    ).toBeInTheDocument();
  });

  it("tells the operator the last catalog is still on screen after a failed refresh", () => {
    render(
      <ConnectionBanner
        online
        isError
        isFetching={false}
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Couldn't refresh. The list below is the last good load."),
    ).toBeInTheDocument();
  });

  it("shows retrying copy while a failed refresh is in flight", () => {
    render(
      <ConnectionBanner
        online
        isError
        isFetching
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Retrying" })).toBeDisabled();
  });

  it("says the catalog is busy on a 429", () => {
    render(
      <ConnectionBanner
        online
        isError
        isBusy
        isFetching={false}
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Catalog is busy. The list below is the last good load."),
    ).toBeInTheDocument();
  });

  it("keeps the list error when categories also failed", () => {
    render(
      <ConnectionBanner
        online
        isError
        filtersError
        isFetching={false}
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Couldn't refresh. The list below is the last good load."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Couldn't load categories. Search and the list still work."),
    ).toBeNull();
  });

  it("says categories failed without hiding that the list still works", () => {
    render(
      <ConnectionBanner
        online
        isError={false}
        filtersError
        isFetching={false}
        hasData
        onRetry={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Couldn't load categories. Search and the list still work."),
    ).toBeInTheDocument();
  });

  it("lets the operator retry a failed refresh", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <ConnectionBanner
        online
        isError
        isFetching={false}
        hasData
        onRetry={onRetry}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Retry now" }));
    expect(onRetry).toHaveBeenCalled();
  });
});
