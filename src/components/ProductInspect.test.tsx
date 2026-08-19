import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { INSPECT_FORBIDDEN } from "../review/locks";
import { makeProduct } from "../test/factories";
import { ProductInspect } from "./ProductInspect";

describe("ProductInspect", () => {
  it("puts price and stock on the glance, then SKU cost tags and description", () => {
    render(
      <ProductInspect
        product={makeProduct({
          name: "Coke Zero",
          brand: "Coca-Cola",
          sku: "BUB-LIME-12",
          price: 2.5,
          cost: 0.84,
          stock: 24,
          category: "Drink",
          tags: ["Cola", "Zero Sugar"],
          description: "Zero-sugar cola in a 12 oz can.",
          size: { value: 12, unit: "oz" },
        })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Coke Zero")).toBeInTheDocument();
    expect(screen.getByText("Coca-Cola")).toBeInTheDocument();
    expect(screen.getByText("24 in this machine")).toBeInTheDocument();
    expect(screen.getByText("$2.50")).toBeInTheDocument();
    expect(screen.getByText("12 oz")).toBeInTheDocument();
    expect(screen.getByText("SKU")).toBeInTheDocument();
    expect(screen.getByText("BUB-LIME-12")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
    expect(screen.getByText("$0.84")).toBeInTheDocument();
    expect(screen.getByText("Margin")).toBeInTheDocument();
    expect(screen.getByText("$1.66")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Cola · Zero Sugar")).toBeInTheDocument();
    expect(screen.getByText("Zero-sugar cola in a 12 oz can.")).toBeInTheDocument();
    expect(screen.getByTestId("product-inspect")).toBeInTheDocument();
    expect(screen.queryByTestId("sheet-handle")).toBeNull();
    expect(document.querySelector("[data-framed='false']")).toBeTruthy();
    for (const label of INSPECT_FORBIDDEN) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it("dashes missing price, cost, and margin", () => {
    render(
      <ProductInspect
        product={makeProduct({ name: "Coke Zero", price: null, cost: null })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Cost").nextElementSibling).toHaveTextContent("—");
    expect(screen.getByText("Margin").nextElementSibling).toHaveTextContent("—");
    expect(screen.queryByText("$0.00")).toBeNull();
  });

  it("keeps a zero price and cost as money, not a dash", () => {
    render(
      <ProductInspect
        product={makeProduct({ name: "Coke Zero", price: 0, cost: 0 })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getAllByText("$0.00")).toHaveLength(3);
    expect(screen.queryByText("—")).toBeNull();
  });

  it("dashes empty SKU, category, and size", () => {
    render(
      <ProductInspect
        product={makeProduct({
          name: "Coke Zero",
          sku: "",
          category: "  ",
          size: { value: 0, unit: "" },
        })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("SKU").nextElementSibling).toHaveTextContent("—");
    expect(screen.getByText("Category").nextElementSibling).toHaveTextContent("—");
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(1);
  });

  it("uses Untitled when the name is empty", () => {
    render(
      <ProductInspect
        product={makeProduct({ name: "" })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("hides stock on a draft and skips empty description and tags", () => {
    render(
      <ProductInspect
        product={makeProduct({
          name: "Draft Test Product",
          status: "draft",
          brand: "",
          stock: 0,
          tags: [],
          description: "   ",
        })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Draft · incomplete catalog item")).toBeInTheDocument();
    expect(screen.getByText("No brand")).toBeInTheDocument();
    expect(screen.queryByText("in this machine")).toBeNull();
    expect(screen.queryByText("Out of stock")).toBeNull();
    expect(screen.queryByText("Tags")).toBeNull();
    expect(screen.queryByText("Description")).toBeNull();
  });

  it("calls out out of stock and low stock", () => {
    const { rerender } = render(
      <ProductInspect
        product={makeProduct({ name: "Coke Zero", stock: 0 })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Out of stock")).toBeInTheDocument();

    rerender(
      <ProductInspect
        product={makeProduct({ name: "Coke Zero", stock: 3 })}
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText("Low stock · 3 in this machine")).toBeInTheDocument();
  });

  it("says when inspect is the list snapshot", () => {
    render(
      <ProductInspect
        product={makeProduct({ name: "Coke Zero", stock: 12 })}
        fromList
        imageTreatment="white-tile"
        onClose={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Could not refresh. This is the list snapshot."),
    ).toBeInTheDocument();
    expect(screen.getByText("12 in this machine")).toBeInTheDocument();
  });

  it("closes from the sheet", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ProductInspect
        product={makeProduct()}
        imageTreatment="white-tile"
        onClose={onClose}
      />,
    );
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalled();
  });
});
