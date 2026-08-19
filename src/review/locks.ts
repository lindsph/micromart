export const THUMB_SIZE = 64;
export const IMAGE_TREATMENT = "white-tile" as const;
export const HEADING_STYLE = "eyebrow" as const;
export const PAGE_SIZE = 20;
export const LOAD_MORE_ROOT_MARGIN = "800px 0px";
export const SEARCH_PLACEHOLDER = "Search name, brand, SKU, or tags";
export const SEARCH_DEBOUNCE_MS = 300;
export const SORT_SPLIT_COLOR = "#A4A9AF";
export const FIND_BAR_SHADOW = "0 8px 20px rgba(16, 24, 40, 0.1)";
/** Inset so the list overflow cannot clip the focus ring. */
export const ROW_FOCUS_SHADOW =
  "inset 0 0 0 2px #2F6FED, 0 1px 2px rgba(16, 24, 40, 0.04)";
export const INSPECT_IMAGE_SIZE = 200;
export const INSPECT_IMAGE_FRAMED = false;
export const INSPECT_PAD = { px: 3, pt: 2.5, pb: 5 } as const;
export const ROW_STOCK_COPY = "in stock";
export const DETAIL_STOCK_COPY = "in this machine";
export const UNTITLED_NAME = "Untitled";
export const EMPTY_FIELD = "—";

export function displayProductName(name: string): string {
  return name.trim() || UNTITLED_NAME;
}

export function displayField(value: string): string {
  return value.trim() || EMPTY_FIELD;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

/** Explicit 0 stays $0.00. Missing money is a dash, not a fake price. */
export function displayMoney(value: number | null): string {
  return value == null ? EMPTY_FIELD : money.format(value);
}

export function displayMargin(price: number | null, cost: number | null): string {
  if (price == null || cost == null) {
    return EMPTY_FIELD;
  }
  return displayMoney(price - cost);
}

export function formatSize(size: { value: number; unit: string }): string {
  const unit = size.unit.trim();
  if (size.value === 0 && !unit) {
    return "";
  }
  if (size.value === 0) {
    return unit;
  }
  if (!unit) {
    return String(size.value);
  }
  return `${size.value} ${unit}`;
}

export function displaySize(size: { value: number; unit: string }): string {
  return formatSize(size) || EMPTY_FIELD;
}

export function displayQuietLine(
  category: string,
  size: { value: number; unit: string },
): string {
  const parts = [category.trim(), formatSize(size)].filter(Boolean);
  return parts.join(" · ") || EMPTY_FIELD;
}

export const INSPECT_FORBIDDEN = [
  "Edit",
  "Restock",
  "UPC",
  "Created",
  "Updated",
] as const;

export const ROW_DETAIL_ONLY = ["SKU", "Cost", "Margin", "Description"] as const;

export const DEVICES = [
  { id: "se", label: "iPhone SE", width: 375, height: 667, layout: "phone", inspect: "sheet" },
  { id: "iphone-16", label: "iPhone 16", width: 393, height: 852, layout: "phone", inspect: "sheet" },
  { id: "iphone-16-pro-max", label: "iPhone 16 Pro Max", width: 440, height: 956, layout: "phone", inspect: "sheet" },
  { id: "ipad-mini", label: "iPad Mini", width: 768, height: 1024, layout: "tablet", inspect: "card" },
  { id: "ipad-pro-13", label: "iPad Pro 13", width: 1032, height: 1376, layout: "tablet", inspect: "card" },
] as const;

export type DeviceId = (typeof DEVICES)[number]["id"];
export type InspectKind = (typeof DEVICES)[number]["inspect"];

/** Portal and body scroll stay off so the sheet lives in the device frame.
 *  Autofocus + restore-focus are on. The focus trap stays off so device tabs
 *  still work. releaseInspectLock still clears leftover inert and scroll. */
export const INSPECT_DIALOG_FLAGS = {
  disablePortal: true,
  disableScrollLock: true,
  disableAutoFocus: false,
  disableRestoreFocus: false,
  disableEnforceFocus: true,
} as const;

export const INSPECT_SHEET_PAPER = {
  m: 0,
  width: "100%",
  maxWidth: "100%",
  height: "100%",
  maxHeight: "100%",
  borderRadius: 0,
  border: 0,
  outline: 0,
  overflow: "auto",
  boxShadow: "none",
} as const;

export const INSPECT_CARD_PAPER = {
  m: 0,
  width: "min(560px, calc(100% - 40px))",
  maxHeight: "calc(100% - 36px)",
  borderRadius: "20px",
  border: 0,
  outline: 0,
  overflow: "auto",
  boxShadow: "0 16px 48px rgba(16, 24, 40, 0.2)",
} as const;

export const INSPECT_CARD_FRAME = {
  alignItems: "flex-start",
  justifyContent: "center",
  pt: "20px",
} as const;
