import { Box } from "@mui/material";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { makeProduct } from "../test/factories";
import { ProductInspectDialog, releaseInspectLock } from "./ProductInspectDialog";

function renderInspect(kind: "sheet" | "card") {
  return render(
    <Box sx={{ position: "relative", width: 390, height: 720 }}>
      <ProductInspectDialog
        product={makeProduct({ stock: 12 })}
        kind={kind}
        onClose={vi.fn()}
      />
    </Box>,
  );
}

describe("ProductInspectDialog", () => {
  it("renders inspect facts without DialogContent or a grab handle", () => {
    renderInspect("card");
    expect(screen.getByTestId("product-inspect")).toBeInTheDocument();
    expect(screen.getByText("12 in this machine")).toBeInTheDocument();
    expect(screen.getByText("SKU")).toBeInTheDocument();
    expect(screen.getByText("BUB-LIME-12")).toBeInTheDocument();
    expect(document.querySelector(".MuiDialogContent-root")).toBeNull();
    expect(screen.queryByTestId("sheet-handle")).toBeNull();
    expect(document.querySelector("[data-inspect-kind='card']")).toBeTruthy();
  });

  it("pins the tablet card near the top", () => {
    renderInspect("card");
    const container = document.querySelector(".MuiDialog-container");
    expect(container).toHaveStyle({
      alignItems: "flex-start",
      paddingTop: "20px",
    });
  });

  it("docks the phone inspect as a sheet", () => {
    renderInspect("sheet");
    expect(document.querySelector("[data-inspect-kind='sheet']")).toBeTruthy();
  });

  it("clears a leftover inert lock on the catalog", () => {
    const frame = document.createElement("div");
    frame.setAttribute("data-testid", "device-frame");
    const catalog = document.createElement("div");
    catalog.setAttribute("data-catalog-screen", "");
    catalog.inert = true;
    catalog.setAttribute("aria-hidden", "true");
    const pane = document.createElement("div");
    pane.setAttribute("data-testid", "catalog-scroll");
    Object.defineProperty(pane, "scrollTop", { writable: true, value: 180 });
    catalog.append(pane);
    const layer = document.createElement("div");
    layer.setAttribute("data-testid", "inspect-layer");
    const overlay = document.createElement("div");
    overlay.inert = true;
    layer.append(overlay);
    frame.append(catalog, layer);
    document.body.append(frame);
    releaseInspectLock(frame);
    expect(catalog.inert).toBe(false);
    expect(catalog.getAttribute("aria-hidden")).toBeNull();
    expect(pane.scrollTop).toBe(180);
    expect(overlay.inert).toBe(true);
    frame.remove();
  });

  it("closes from the card", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Box sx={{ position: "relative", width: 390, height: 720 }}>
        <ProductInspectDialog
          product={makeProduct()}
          kind="sheet"
          onClose={onClose}
        />
      </Box>,
    );
    await user.click(screen.getByText("Close"));
    expect(onClose).toHaveBeenCalled();
  });
});
