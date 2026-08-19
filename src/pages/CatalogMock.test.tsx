import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as productsApi from "../api/products";
import type { ProductListQuery } from "../api/query";
import { DEVICES } from "../review/locks";
import { makeProduct } from "../test/factories";
import { CatalogMock } from "./CatalogMock";

vi.mock("../api/products", () => ({
  fetchCategories: vi.fn(),
  fetchProductList: vi.fn(),
  fetchProduct: vi.fn(),
}));

function renderCatalog() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CatalogMock />
    </QueryClientProvider>,
  );
}

function firstPhone() {
  return screen.getAllByTestId("catalog-scroll")[0]?.closest("[data-catalog-screen]");
}

function inspectClose() {
  return screen.getByRole("button", { name: "Close", hidden: true });
}

describe("CatalogMock", () => {
  beforeEach(() => {
    vi.mocked(productsApi.fetchCategories).mockResolvedValue(["Drink"]);
    vi.mocked(productsApi.fetchProduct).mockImplementation(async (id) =>
      makeProduct({ id, name: "Sparkling Water", stock: 12 }),
    );
    vi.mocked(productsApi.fetchProductList).mockImplementation(
      async (query: ProductListQuery) => {
        const first = !query.cursor;
        return {
          data: [
            makeProduct({
              id: first ? 1 : 21,
              name: query.search ? "Coke Zero" : "Sparkling Water",
              stock: 12,
            }),
          ],
          total: query.search ? 3 : 40,
          page: first ? 1 : 2,
          limit: 20,
          nextCursor: first ? "cursor-page-2" : undefined,
        };
      },
    );
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return [];
        }
      },
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("loads the catalog from the API in pages of 20", async () => {
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );
    expect(productsApi.fetchProductList).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        page: 1,
        sort: "name",
        order: "asc",
      }),
      expect.anything(),
    );
    expect(screen.queryByText("Load more")).toBeNull();
  });

  it("says when categories fail instead of hiding the chips with no banner", async () => {
    vi.mocked(productsApi.fetchCategories).mockRejectedValue(new Error("offline"));
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );
    expect(
      screen.getByText("Couldn't load categories. Search and the list still work."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Drink" })).toBeNull();
  });

  it("sends the API cursor for the next page", async () => {
    const observers: Array<{ trigger: (intersecting: boolean) => void }> = [];
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        callback: IntersectionObserverCallback;
        constructor(callback: IntersectionObserverCallback) {
          this.callback = callback;
          observers.push({
            trigger: (intersecting: boolean) => {
              callback(
                [{ isIntersecting: intersecting } as IntersectionObserverEntry],
                this as unknown as IntersectionObserver,
              );
            },
          });
        }
        observe() {}
        disconnect() {}
        unobserve() {}
        takeRecords() {
          return [];
        }
      },
    );

    renderCatalog();
    await waitFor(() =>
      expect(screen.getByTestId("catalog-load-more")).toBeInTheDocument(),
    );
    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    observers.at(-1)?.trigger(true);

    await waitFor(() => {
      const next = vi.mocked(productsApi.fetchProductList).mock.calls.find(
        ([query]) => query.cursor === "cursor-page-2",
      );
      expect(next?.[0]).toEqual(
        expect.objectContaining({ cursor: "cursor-page-2", limit: 20 }),
      );
      expect(next?.[0]?.page).toBeUndefined();
    });
  });

  it("sends typed search to the API after debounce and clears immediately", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByLabelText("Search catalog").length).toBeGreaterThan(0),
    );

    await user.type(screen.getAllByLabelText("Search catalog")[0]!, "coke");
    await waitFor(() =>
      expect(productsApi.fetchProductList).toHaveBeenCalledWith(
        expect.objectContaining({ search: "coke", page: 1 }),
        expect.anything(),
      ),
    );

    await user.click(screen.getAllByRole("button", { name: "Clear search" })[0]!);
    await waitFor(() => {
      const calls = vi.mocked(productsApi.fetchProductList).mock.calls;
      expect(
        calls.some(([query]) => query.search == null || query.search === ""),
      ).toBe(true);
    });
  });

  it("sends a new sort to the API from page 1", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone();
    expect(phone).toBeTruthy();
    await user.click(within(phone as HTMLElement).getByRole("button", { name: "Sort catalog" }));
    await user.click(screen.getByRole("menuitem", { name: "Price · low to high" }));

    await waitFor(() =>
      expect(productsApi.fetchProductList).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "price", order: "asc", page: 1 }),
        expect.anything(),
      ),
    );
  });

  it("sends a featured brand to the API", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByRole("button", { name: "Filter by brand" }));
    await user.click(screen.getByRole("menuitem", { name: "Fairlife" }));

    await waitFor(() =>
      expect(productsApi.fetchProductList).toHaveBeenCalledWith(
        expect.objectContaining({ brand: "Fairlife", page: 1 }),
        expect.anything(),
      ),
    );

    await user.click(within(phone).getByRole("button", { name: "Filter by brand" }));
    await user.click(screen.getByRole("menuitem", { name: "All brands" }));
    await waitFor(() => {
      const calls = vi.mocked(productsApi.fetchProductList).mock.calls;
      expect(
        calls.some(([query]) => query.brand == null || query.brand === ""),
      ).toBe(true);
    });
  });

  it("sends stock-lowest sort to the API instead of offering Out or Draft chips", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    expect(within(phone).queryByRole("button", { name: "Out" })).toBeNull();
    expect(within(phone).queryByRole("button", { name: "Low" })).toBeNull();
    expect(within(phone).queryByRole("button", { name: "Draft" })).toBeNull();

    await user.click(within(phone).getByRole("button", { name: "Sort catalog" }));
    await user.click(screen.getByRole("menuitem", { name: "Stock · lowest first" }));

    await waitFor(() =>
      expect(productsApi.fetchProductList).toHaveBeenCalledWith(
        expect.objectContaining({ sort: "stock", order: "asc", page: 1 }),
        expect.anything(),
      ),
    );
  });

  it("switches device frames from the tab bar", async () => {
    const user = userEvent.setup();
    renderCatalog();
    expect(screen.getByRole("tab", { name: "iPhone SE" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.queryByText(/375×667/)).toBeNull();
    expect(screen.queryByText(/64px thumbs/)).toBeNull();
    expect(screen.getByTestId("device-frame")).toHaveAttribute("data-device", "se");
    expect(screen.getByTestId("device-frame")).toHaveStyle({ width: "375px", height: "667px" });
    expect(getComputedStyle(screen.getByTestId("device-frame")).maxHeight).not.toBe("100%");
    expect(screen.getByTestId("inspect-layer")).toHaveStyle({ pointerEvents: "none" });
    expect(screen.getAllByTestId("catalog-scroll")).toHaveLength(1);
    expect(screen.getByRole("tab", { name: "iPhone 16" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "iPhone 16 Pro Max" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "iPad Pro 13" })).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "iPad Mini" }));
    expect(screen.getByRole("tab", { name: "iPad Mini" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByTestId("device-frame")).toHaveAttribute("data-device", "ipad-mini");
    expect(screen.getByTestId("device-frame")).toHaveStyle({ width: "768px", height: "1024px" });
    expect(screen.queryByRole("tab", { name: "Desktop" })).toBeNull();
    expect(screen.queryByRole("tab", { name: "iPhone 14" })).toBeNull();
  });

  it("sizes every device to the current Chrome DevTools CSS viewport", async () => {
    const user = userEvent.setup();
    renderCatalog();
    for (const device of DEVICES) {
      await user.click(screen.getByRole("tab", { name: device.label }));
      expect(screen.getByTestId("device-frame")).toHaveAttribute("data-device", device.id);
      expect(screen.getByTestId("device-frame")).toHaveStyle({
        width: `${device.width}px`,
        height: `${device.height}px`,
      });
    }
  });

  it("keeps one catalog and the typed search when switching phone frames", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByLabelText("Search catalog").length).toBeGreaterThan(0),
    );
    const search = screen.getByLabelText("Search catalog");
    await user.type(search, "coke");
    await user.click(screen.getByRole("tab", { name: "iPhone 16" }));
    expect(screen.getAllByTestId("catalog-scroll")).toHaveLength(1);
    expect(screen.getByLabelText("Search catalog")).toHaveValue("coke");
    expect(screen.getByTestId("device-frame")).toHaveAttribute("data-device", "iphone-16");
  });

  it("sends a category to the API from the chip rail", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByText("Drink"));

    await waitFor(() =>
      expect(productsApi.fetchProductList).toHaveBeenCalledWith(
        expect.objectContaining({ category: "Drink" }),
        expect.anything(),
      ),
    );
    expect(within(phone).getByRole("button", { name: "Drink" })).toHaveClass(
      "MuiChip-filled",
    );
    expect(within(phone).queryByRole("button", { name: "All" })).toBeNull();
  });

  it("closes inspect and unlocks the list when the device tab changes", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByRole("button", { name: /Sparkling Water/ }));
    expect(screen.getByTestId("product-inspect")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "iPhone 16", hidden: true }));
    await waitFor(() => expect(screen.queryByTestId("product-inspect")).toBeNull());
    expect(screen.getByTestId("inspect-layer")).toHaveStyle({ pointerEvents: "none" });
    expect(document.querySelector("[data-catalog-screen]")?.hasAttribute("inert")).toBe(
      false,
    );
    expect(screen.getAllByTestId("catalog-scroll")).toHaveLength(1);
    expect(screen.getByLabelText("Search catalog")).toBeInTheDocument();
  });

  it("moves focus into inspect and back to the row", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    const row = within(phone).getByRole("button", { name: /Sparkling Water/ });
    await user.click(row);

    await waitFor(() => expect(inspectClose()).toHaveFocus());

    await user.click(inspectClose());
    await waitFor(() => expect(screen.queryByTestId("product-inspect")).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Sparkling Water/ })).toHaveFocus(),
    );
  });

  it("closes inspect on Escape", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByRole("button", { name: /Sparkling Water/ }));
    await waitFor(() => expect(inspectClose()).toHaveFocus());

    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByTestId("product-inspect")).toBeNull());
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Sparkling Water/ })).toBeEnabled(),
    );
  });

  it("search still accepts input after inspect closes", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByRole("button", { name: /Sparkling Water/ }));
    await user.click(screen.getByText("Close"));
    await waitFor(() => expect(screen.queryByTestId("product-inspect")).toBeNull());

    const search = screen.getByLabelText("Search catalog");
    await user.type(search, "coke");
    expect(search).toHaveValue("coke");
  });

  it("opens a phone sheet and unlocks the list when it closes", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByRole("button", { name: /Sparkling Water/ }));
    expect(document.querySelector("[data-inspect-kind='sheet']")).toBeTruthy();
    expect(screen.getByTestId("inspect-layer")).toHaveStyle({ pointerEvents: "auto" });

    await user.click(screen.getByText("Close"));
    await waitFor(() => expect(screen.queryByTestId("product-inspect")).toBeNull());
    expect(screen.getByTestId("inspect-layer")).toHaveStyle({ pointerEvents: "none" });
    expect(document.querySelector("[data-catalog-screen]")?.hasAttribute("inert")).toBe(
      false,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Sparkling Water/ })).toBeEnabled(),
    );
  });

  it("opens the iPad inspect as a top-aligned card", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await user.click(screen.getByRole("tab", { name: "iPad Mini" }));
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );
    await user.click(screen.getByRole("button", { name: /Sparkling Water/ }));
    expect(document.querySelector("[data-inspect-kind='card']")).toBeTruthy();
    expect(document.querySelector(".MuiDialog-container")).toHaveStyle({
      alignItems: "flex-start",
      paddingTop: "20px",
    });
    expect(screen.getByTestId("inspect-layer")).toHaveStyle({ pointerEvents: "auto" });
  });

  it("opens the inspect sheet with cost and SKU from a row", async () => {
    const user = userEvent.setup();
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone();
    await user.click(within(phone as HTMLElement).getByRole("button", { name: /Sparkling Water/ }));

    expect(screen.getByText("12 in this machine")).toBeInTheDocument();
    expect(screen.getByText("SKU")).toBeInTheDocument();
    expect(screen.getByText("BUB-LIME-12")).toBeInTheDocument();
    expect(screen.getByText("Cost")).toBeInTheDocument();
    expect(screen.getByText("$0.60")).toBeInTheDocument();
    expect(screen.getByText("Margin")).toBeInTheDocument();
    expect(screen.getByText("Lime sparkling water")).toBeInTheDocument();
  });

  it("refreshes inspect from the live SKU after opening the list row", async () => {
    const user = userEvent.setup();
    let resolveDetail: (product: ReturnType<typeof makeProduct>) => void = () => {};
    vi.mocked(productsApi.fetchProduct).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDetail = resolve;
        }),
    );
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByRole("button", { name: /Sparkling Water/ }));
    expect(screen.getByText("12 in this machine")).toBeInTheDocument();
    await waitFor(() => expect(productsApi.fetchProduct).toHaveBeenCalled());

    resolveDetail(makeProduct({ id: 1, name: "Sparkling Water", stock: 3 }));
    await waitFor(() =>
      expect(
        screen.getByText("Low stock · 3 in this machine"),
      ).toBeInTheDocument(),
    );
    expect(screen.queryByText("Could not refresh. This is the list snapshot.")).toBeNull();
    expect(productsApi.fetchProduct).toHaveBeenCalledWith(1, expect.anything());
  });

  it("keeps the list snapshot on inspect when the live SKU fails", async () => {
    const user = userEvent.setup();
    let rejectDetail: (error: Error) => void = () => {};
    vi.mocked(productsApi.fetchProduct).mockImplementation(
      () =>
        new Promise((_, reject) => {
          rejectDetail = reject;
        }),
    );
    renderCatalog();
    await waitFor(() =>
      expect(screen.getAllByText("Sparkling Water").length).toBeGreaterThan(0),
    );

    const phone = firstPhone() as HTMLElement;
    await user.click(within(phone).getByRole("button", { name: /Sparkling Water/ }));
    expect(screen.getByText("12 in this machine")).toBeInTheDocument();
    await waitFor(() => expect(productsApi.fetchProduct).toHaveBeenCalled());

    rejectDetail(new Error("offline"));
    await waitFor(() =>
      expect(
        screen.getByText("Could not refresh. This is the list snapshot."),
      ).toBeInTheDocument(),
    );
    expect(screen.getByText("12 in this machine")).toBeInTheDocument();
  });
});
