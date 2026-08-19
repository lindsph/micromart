import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ROW_FOCUS_SHADOW } from "../review/locks";
import { makeProduct } from "../test/factories";
import { CatalogRow } from "./CatalogRow";

describe("CatalogRow", () => {
  it("shows stock for a finalized product", () => {
    render(
      <CatalogRow
        product={makeProduct({ stock: 12, name: "Coke Zero" })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("Coke Zero")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("in stock")).toBeInTheDocument();
    expect(screen.queryByText("in this machine")).toBeNull();
    expect(screen.getByText("$1.99")).toBeInTheDocument();
    expect(screen.queryByText("SKU")).toBeNull();
    expect(screen.queryByText("Cost")).toBeNull();
    expect(screen.queryByText("Margin")).toBeNull();
    expect(screen.queryByText("Lime sparkling water")).toBeNull();
  });

  it("shows No brand when brand is empty", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero", brand: "" })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("No brand")).toBeInTheDocument();
  });

  it("dashes a missing price instead of showing $0.00", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero", price: null })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("$0.00")).toBeNull();
  });

  it("does not call missing stock out of stock", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero", stock: null, category: "Drink" })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.queryByText("Out of stock")).toBeNull();
    expect(screen.getByText("Drink · 12 oz")).toBeInTheDocument();
  });

  it("keeps a zero price as money, not a dash", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero", price: 0 })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("$0.00")).toBeInTheDocument();
    expect(screen.queryByText("—")).toBeNull();
  });

  it("uses Untitled when the name is empty", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "   " })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /Untitled/ })).toBeInTheDocument();
  });

  it("hides stock on draft rows", () => {
    render(
      <CatalogRow
        product={makeProduct({
          name: "Draft Test Product",
          status: "draft",
          stock: 0,
          brand: "",
        })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("Draft")).toBeInTheDocument();
    expect(screen.getByText("Draft · incomplete catalog item")).toBeInTheDocument();
    expect(screen.queryByText("in stock")).toBeNull();
  });

  it("keeps the focus ring inside the row so the list cannot clip it", async () => {
    const user = userEvent.setup();
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero" })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    const row = screen.getByRole("button", { name: /Coke Zero/ });
    await user.tab();
    expect(row).toHaveFocus();
    const css = [...document.querySelectorAll("style")]
      .map((node) => node.textContent ?? "")
      .join("");
    expect(css).toContain("inset 0 0 0 2px");
    expect(ROW_FOCUS_SHADOW).toContain("inset");
  });

  it("opens the product when the row is pressed", async () => {
    const user = userEvent.setup();
    const product = makeProduct({ name: "Coke Zero" });
    const onOpen = vi.fn();
    render(
      <CatalogRow
        product={product}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={onOpen}
      />,
    );
    await user.click(screen.getByRole("button", { name: /Coke Zero/ }));
    expect(onOpen).toHaveBeenCalledWith(product);
  });

  it("drops the status dot on phone so the name can use that space", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero" })}
        imageSize={64}
        imageTreatment="white-tile"
        layout="phone"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("status-dot")).toBeNull();
  });

  it("shows out of stock and low stock on the status line", () => {
    const { rerender } = render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero", stock: 0, category: "Drink" })}
        imageSize={64}
        imageTreatment="white-tile"
        layout="phone"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
    expect(screen.getByText("in stock")).toBeInTheDocument();

    rerender(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero", stock: 4, category: "Drink" })}
        imageSize={64}
        imageTreatment="white-tile"
        layout="phone"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("Low stock")).toBeInTheDocument();
  });

  it("keeps category and size quiet on a healthy row", () => {
    render(
      <CatalogRow
        product={makeProduct({
          name: "Coke Zero",
          category: "Drink",
          size: { value: 12, unit: "oz" },
          stock: 12,
        })}
        imageSize={64}
        imageTreatment="white-tile"
        layout="phone"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("Drink · 12 oz")).toBeInTheDocument();
  });

  it("dashes an empty category and size on a healthy row", () => {
    render(
      <CatalogRow
        product={makeProduct({
          name: "Coke Zero",
          category: "",
          size: { value: 0, unit: "" },
          stock: 12,
        })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("defaults to the phone layout without a status dot", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero" })}
        imageSize={64}
        imageTreatment="white-tile"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.queryByTestId("status-dot")).toBeNull();
  });

  it("keeps the status dot on tablet", () => {
    render(
      <CatalogRow
        product={makeProduct({ name: "Coke Zero" })}
        imageSize={64}
        imageTreatment="white-tile"
        layout="tablet"
        onOpen={vi.fn()}
      />,
    );
    expect(screen.getByTestId("status-dot")).toBeInTheDocument();
  });
});
