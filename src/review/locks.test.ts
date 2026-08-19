import { describe, expect, it } from "vitest";
import { LOW_STOCK } from "../lib/catalogFilters";
import {
  DESKTOP_INSPECT_WIDTH,
  DESKTOP_ROW_GRID,
  DEVICES,
  DETAIL_STOCK_COPY,
  HEADING_STYLE,
  IMAGE_TREATMENT,
  INSPECT_CARD_FRAME,
  INSPECT_CARD_PAPER,
  INSPECT_DIALOG_FLAGS,
  INSPECT_FORBIDDEN,
  INSPECT_IMAGE_FRAMED,
  INSPECT_IMAGE_SIZE,
  INSPECT_PAD,
  INSPECT_SHEET_PAPER,
  LOAD_MORE_ROOT_MARGIN,
  PAGE_SIZE,
  ROW_DETAIL_ONLY,
  ROW_STOCK_COPY,
  UNTITLED_NAME,
  EMPTY_FIELD,
  displayProductName,
  displayField,
  displayMoney,
  displayMargin,
  displaySize,
  displayQuietLine,
  formatSize,
  SEARCH_DEBOUNCE_MS,
  SEARCH_PLACEHOLDER,
  SORT_SPLIT_COLOR,
  FIND_BAR_SHADOW,
  ROW_FOCUS_SHADOW,
  THUMB_SIZE,
} from "./locks";

describe("visual locks", () => {
  it("keeps the shipped catalog chrome numbers", () => {
    expect(THUMB_SIZE).toBe(64);
    expect(IMAGE_TREATMENT).toBe("white-tile");
    expect(HEADING_STYLE).toBe("eyebrow");
    expect(PAGE_SIZE).toBe(20);
    expect(DESKTOP_ROW_GRID).toBe(
      "64px minmax(200px, 2.2fr) 132px minmax(128px, 1.2fr) 96px 72px 72px",
    );
    expect(DESKTOP_INSPECT_WIDTH).toBe(400);
    expect(LOAD_MORE_ROOT_MARGIN).toBe("800px 0px");
    expect(SEARCH_DEBOUNCE_MS).toBe(300);
    expect(SEARCH_PLACEHOLDER).toBe("Search name, brand, SKU, or tags");
    expect(SORT_SPLIT_COLOR).toBe("#A4A9AF");
    expect(FIND_BAR_SHADOW).toBe("0 8px 20px rgba(16, 24, 40, 0.1)");
    expect(ROW_FOCUS_SHADOW).toContain("inset 0 0 0 2px");
    expect(LOW_STOCK).toBe(5);
  });

  it("keeps row stock copy short and detail stock copy specific", () => {
    expect(ROW_STOCK_COPY).toBe("in stock");
    expect(DETAIL_STOCK_COPY).toBe("in this machine");
    expect(UNTITLED_NAME).toBe("Untitled");
    expect(displayProductName("")).toBe("Untitled");
    expect(displayProductName("   ")).toBe("Untitled");
    expect(displayProductName("Coke Zero")).toBe("Coke Zero");
    expect(EMPTY_FIELD).toBe("—");
    expect(displayField("")).toBe("—");
    expect(displayField("   ")).toBe("—");
    expect(displayField("  BUB-1  ")).toBe("BUB-1");
    expect(displayMoney(null)).toBe("—");
    expect(displayMoney(0)).toBe("$0.00");
    expect(displayMoney(1.99)).toBe("$1.99");
    expect(displayMargin(null, 0.6)).toBe("—");
    expect(displayMargin(1.99, null)).toBe("—");
    expect(displayMargin(2.5, 0.84)).toBe("$1.66");
    expect(formatSize({ value: 0, unit: "" })).toBe("");
    expect(formatSize({ value: 0, unit: "oz" })).toBe("oz");
    expect(formatSize({ value: 12, unit: "" })).toBe("12");
    expect(displaySize({ value: 0, unit: "" })).toBe("—");
    expect(displaySize({ value: 0, unit: "oz" })).toBe("oz");
    expect(displaySize({ value: 12, unit: "oz" })).toBe("12 oz");
    expect(displayQuietLine("", { value: 0, unit: "" })).toBe("—");
    expect(displayQuietLine("Drink", { value: 0, unit: "" })).toBe("Drink");
    expect(displayQuietLine("", { value: 12, unit: "oz" })).toBe("12 oz");
    expect(displayQuietLine("Drink", { value: 12, unit: "oz" })).toBe("Drink · 12 oz");
    expect(ROW_DETAIL_ONLY).toEqual(["SKU", "Cost", "Margin", "Description"]);
  });

  it("keeps inspect as an unframed pack with even padding", () => {
    expect(INSPECT_IMAGE_SIZE).toBe(200);
    expect(INSPECT_IMAGE_FRAMED).toBe(false);
    expect(INSPECT_PAD).toEqual({ px: 3, pt: 2.5, pb: 5 });
    expect(INSPECT_FORBIDDEN).toEqual(["Edit", "Restock", "UPC", "Created", "Updated"]);
    expect(INSPECT_DIALOG_FLAGS).toEqual({
      disablePortal: true,
      disableScrollLock: true,
      disableAutoFocus: false,
      disableRestoreFocus: false,
      disableEnforceFocus: true,
    });
    expect(INSPECT_SHEET_PAPER.height).toBe("100%");
    expect(INSPECT_SHEET_PAPER.maxHeight).toBe("100%");
    expect(INSPECT_SHEET_PAPER.borderRadius).toBe(0);
    expect(INSPECT_SHEET_PAPER.width).toBe("100%");
    expect(INSPECT_CARD_PAPER.borderRadius).toBe("20px");
    expect(INSPECT_CARD_PAPER.width).toBe("min(560px, calc(100% - 40px))");
    expect(INSPECT_CARD_PAPER.maxHeight).toBe("calc(100% - 36px)");
    expect(INSPECT_CARD_FRAME).toEqual({
      alignItems: "flex-start",
      justifyContent: "center",
      pt: "20px",
    });
  });

  it("keeps one-frame device review: phone sheets, tablet cards, desktop panel", () => {
    expect(DEVICES.map((device) => ({
      id: device.id,
      label: device.label,
      width: device.width,
      height: device.height,
      layout: device.layout,
      inspect: device.inspect,
    }))).toEqual([
      { id: "se", label: "iPhone SE", width: 375, height: 667, layout: "phone", inspect: "sheet" },
      { id: "iphone-16", label: "iPhone 16", width: 393, height: 852, layout: "phone", inspect: "sheet" },
      { id: "iphone-16-pro-max", label: "iPhone 16 Pro Max", width: 440, height: 956, layout: "phone", inspect: "sheet" },
      { id: "ipad-mini", label: "iPad Mini", width: 768, height: 1024, layout: "tablet", inspect: "card" },
      { id: "ipad-pro-13", label: "iPad Pro 13", width: 1032, height: 1376, layout: "tablet", inspect: "card" },
      { id: "desktop", label: "Desktop", width: 1280, height: 800, layout: "desktop", inspect: "panel" },
    ]);
    expect(DEVICES.filter((device) => device.layout === "phone").every((device) => device.inspect === "sheet")).toBe(true);
    expect(DEVICES.filter((device) => device.layout === "tablet").every((device) => device.inspect === "card")).toBe(true);
    expect(DEVICES.filter((device) => device.layout === "desktop").every((device) => device.inspect === "panel")).toBe(true);
    expect(DEVICES[0]?.id).toBe("se");
  });
});
