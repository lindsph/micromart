import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FIND_BAR_SHADOW, SEARCH_PLACEHOLDER, SORT_SPLIT_COLOR } from "../review/locks";
import { makeProduct } from "../test/factories";
import {
  CatalogScreen,
  StickyFindBar,
  type CatalogScreenProps,
} from "./CatalogScreen";

function screenProps(overrides: Partial<CatalogScreenProps> = {}): CatalogScreenProps {
  return {
    layout: "phone",
    search: "",
    onSearchChange: vi.fn(),
    onPick: vi.fn(),
    category: "",
    categories: ["Drink", "Snack"],
    onCategory: vi.fn(),
    brand: "",
    brands: ["Coca-Cola", "Gatorade"],
    onBrand: vi.fn(),
    sort: "name-asc",
    onSort: vi.fn(),
    imageSize: 64,
    imageTreatment: "white-tile",
    headingStyle: "eyebrow",
    resultCount: 1,
    total: 251,
    searchLabel: "",
    rows: [makeProduct()],
    isPending: false,
    isError: false,
    hasData: true,
    hasMore: true,
    isLoadingMore: false,
    isRefreshing: false,
    onLoadMore: vi.fn(),
    ...overrides,
  };
}

function renderScreen(overrides: Partial<CatalogScreenProps> = {}) {
  const props = screenProps(overrides);
  const view = render(<CatalogScreen {...props} />);
  return {
    ...view,
    props,
    rerenderScreen: (next: Partial<CatalogScreenProps> = {}) =>
      view.rerender(<CatalogScreen {...screenProps({ ...overrides, ...next })} />),
  };
}

function stubIntersectionObserver() {
  const observers: Array<{
    trigger: (intersecting: boolean) => void;
  }> = [];
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
  return observers;
}

async function scrollListPastHeading() {
  const heading = screen.getByTestId("catalog-heading");
  const scroller = screen.getByTestId("catalog-scroll");
  Object.defineProperty(heading, "offsetHeight", { configurable: true, value: 80 });
  scroller.scrollTop = 120;
  fireEvent.scroll(scroller);
  await waitFor(() =>
    expect(screen.getByTestId("catalog-sticky-search")).toHaveAttribute(
      "data-compact",
      "true",
    ),
  );
}

describe("CatalogScreen", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the Catalog eyebrow over Products", () => {
    renderScreen();
    expect(screen.getByText("Catalog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 251")).toBeInTheDocument();
  });

  it("keeps a long result count on one line", () => {
    renderScreen({
      searchLabel: "sparkling water zero sugar",
      total: 12,
    });
    const count = screen.getByText("12 results for “sparkling water zero sugar”");
    expect(count).toHaveStyle({ whiteSpace: "nowrap" });
  });

  it("keeps search in the list under the heading until the title scrolls away", () => {
    renderScreen();
    const scroller = screen.getByTestId("catalog-scroll");
    const sticky = screen.getByTestId("catalog-sticky-search");
    expect(scroller.contains(screen.getByTestId("catalog-heading"))).toBe(true);
    expect(scroller.contains(screen.getByTestId("catalog-chip-rail"))).toBe(true);
    expect(scroller.contains(sticky)).toBe(true);
    expect(scroller).toHaveStyle({ overflow: "auto" });
    expect(scroller).toHaveStyle({ overflowX: "hidden" });
    expect(scroller).toHaveStyle({ overscrollBehavior: "contain" });
    expect(sticky.contains(screen.getByLabelText("Search catalog"))).toBe(true);
    expect(sticky.contains(screen.getByRole("heading", { name: "Products" }))).toBe(
      false,
    );
    expect(sticky).toHaveAttribute("data-compact", "false");
    expect(sticky).toHaveStyle({ position: "sticky" });
    expect(sticky).toHaveStyle({ boxShadow: "none" });
  });

  it("collapses the stuck chrome to Products plus search", () => {
    render(<StickyFindBar compact search="" onSearchChange={vi.fn()} />);
    const sticky = screen.getByTestId("catalog-sticky-search");
    expect(sticky).toHaveAttribute("data-compact", "true");
    expect(screen.getByTestId("sticky-products-label")).toBeInTheDocument();
    expect(screen.getByLabelText("Search catalog")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Products" })).toBeNull();
    expect(sticky).toHaveStyle({ boxShadow: FIND_BAR_SHADOW });
  });

  it("collapses to the one-row bar after the heading scrolls away", async () => {
    renderScreen();
    expect(screen.getByTestId("catalog-sticky-search")).toHaveAttribute(
      "data-compact",
      "false",
    );
    await scrollListPastHeading();
    const scroller = screen.getByTestId("catalog-scroll");
    const sticky = screen.getByTestId("catalog-sticky-search");
    expect(scroller.contains(sticky)).toBe(true);
    expect(screen.queryByTestId("catalog-find-spacer")).toBeNull();
    expect(sticky).toHaveAttribute("data-compact", "true");
    expect(screen.getByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByTestId("sticky-products-label")).toBeInTheDocument();
    expect(sticky).toHaveStyle({ boxShadow: FIND_BAR_SHADOW });
  });

  it("opens the full heading again when the list returns to the top", async () => {
    renderScreen();
    await scrollListPastHeading();
    const scroller = screen.getByTestId("catalog-scroll");
    scroller.scrollTop = 0;
    fireEvent.scroll(scroller);
    await waitFor(() =>
      expect(screen.getByTestId("catalog-sticky-search")).toHaveAttribute(
        "data-compact",
        "false",
      ),
    );
  });

  it("scrolls to the top of the new list when search settles", async () => {
    const { rerenderScreen } = renderScreen();
    const scroller = screen.getByTestId("catalog-scroll");
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo;
    scroller.scrollTop = 240;

    rerenderScreen({ searchLabel: "coke", resultCount: 3, total: 3 });

    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0 }));
  });

  it("scrolls to the top when sort or filter changes", async () => {
    const { rerenderScreen } = renderScreen();
    const scroller = screen.getByTestId("catalog-scroll");
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo;

    rerenderScreen({ sort: "price-asc" });
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0 }));

    scrollTo.mockClear();
    rerenderScreen({ sort: "price-asc", category: "Drink" });
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith({ top: 0 }));
  });

  it("does not jump to the top while a new search is still in flight", () => {
    const { rerenderScreen } = renderScreen();
    const scroller = screen.getByTestId("catalog-scroll");
    const scrollTo = vi.fn();
    scroller.scrollTo = scrollTo;

    rerenderScreen({ searchLabel: "coke", isRefreshing: true });

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("holds the count line while a search is still in flight", () => {
    const { rerenderScreen } = renderScreen({
      searchLabel: "",
      total: 251,
      resultCount: 20,
    });
    expect(screen.getByText("Showing 20 of 251")).toBeInTheDocument();

    rerenderScreen({
      searchLabel: "coke",
      resultCount: 20,
      total: 251,
      isRefreshing: true,
    });

    expect(screen.getByText("Showing 20 of 251")).toBeInTheDocument();
    expect(screen.queryByText(/results for/)).toBeNull();
  });

  it("updates the count once the new search lands", () => {
    const { rerenderScreen } = renderScreen({
      searchLabel: "",
      total: 251,
      resultCount: 20,
    });
    rerenderScreen({
      searchLabel: "coke",
      resultCount: 3,
      total: 3,
      isRefreshing: false,
    });
    expect(screen.getByText("3 results for “coke”")).toBeInTheDocument();
  });

  it("puts sort first in the filter rail, not as a labeled field", async () => {
    const user = userEvent.setup();
    const onSort = vi.fn();
    renderScreen({ onSort });
    expect(screen.queryByLabelText("Sort")).toBeNull();
    const rail = screen.getByTestId("catalog-chip-rail");
    const buttons = within(rail).getAllByRole("button");
    expect(buttons[0]).toHaveAccessibleName("Sort catalog");
    expect(buttons[0]).toHaveAttribute("aria-haspopup", "menu");
    expect(buttons[0].querySelector("svg")).toBeTruthy();
    expect(within(rail).getByTestId("sort-filter-split")).toHaveStyle({
      backgroundColor: SORT_SPLIT_COLOR,
    });
    expect(buttons[1]).toHaveAccessibleName("Filter by brand");
    expect(buttons[1]).toHaveAttribute("aria-haspopup", "menu");
    expect(buttons[2]).toHaveTextContent("Drink");
    const sort = buttons[0];
    const brand = buttons[1];
    const split = within(rail).getByTestId("sort-filter-split");
    const drink = within(rail).getByRole("button", { name: "Drink" });
    expect(sort.compareDocumentPosition(brand) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(brand.compareDocumentPosition(split) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(split.compareDocumentPosition(drink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(rail).queryByRole("button", { name: "All" })).toBeNull();
    expect(within(rail).queryByRole("button", { name: "Out" })).toBeNull();
    expect(within(rail).queryByRole("button", { name: "Low" })).toBeNull();
    expect(within(rail).queryByRole("button", { name: "Draft" })).toBeNull();
    await user.click(buttons[0]);
    await user.click(screen.getByRole("menuitem", { name: "Stock · lowest first" }));
    expect(onSort).toHaveBeenCalledWith("stock-asc");
  });

  it("does not offer All, Out, Low, or Draft chips", () => {
    renderScreen({ layout: "phone" });
    const rail = screen.getByTestId("catalog-chip-rail");
    expect(within(rail).queryByText("All")).toBeNull();
    expect(within(rail).queryByText("Out")).toBeNull();
    expect(within(rail).queryByText("Out of stock")).toBeNull();
    expect(within(rail).queryByText("Low")).toBeNull();
    expect(within(rail).queryByText("Draft")).toBeNull();
  });

  it("picks a brand from the menu and clears with All brands", async () => {
    const user = userEvent.setup();
    const onBrand = vi.fn();
    const { rerenderScreen } = renderScreen({ onBrand, brand: "" });
    await user.click(screen.getByRole("button", { name: "Filter by brand" }));
    await user.click(screen.getByRole("menuitem", { name: "Gatorade" }));
    expect(onBrand).toHaveBeenCalledWith("Gatorade");

    rerenderScreen({ onBrand, brand: "Gatorade", total: 5 });
    expect(screen.getByText("5 Gatorade")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Filter by brand" }));
    await user.click(screen.getByRole("menuitem", { name: "All brands" }));
    expect(onBrand).toHaveBeenLastCalledWith("");
  });

  it("applies a category chip and deselects it on a second click", async () => {
    const user = userEvent.setup();
    const onCategory = vi.fn();
    const { rerenderScreen } = renderScreen({ onCategory });
    await user.click(screen.getByText("Snack"));
    expect(onCategory).toHaveBeenCalledWith("Snack");

    rerenderScreen({ onCategory, category: "Snack" });
    await user.click(screen.getByText("Snack"));
    expect(onCategory).toHaveBeenLastCalledWith("");
  });

  it("hides the sort split when there are no categories", () => {
    renderScreen({ categories: [] });
    expect(screen.queryByTestId("sort-filter-split")).toBeNull();
  });

  it("hides the brand menu when there is no brand list", () => {
    renderScreen({ brands: [] });
    expect(screen.queryByRole("button", { name: "Filter by brand" })).toBeNull();
  });

  it("shows a placeholder that matches what the API search covers", () => {
    renderScreen();
    expect(screen.getByLabelText("Search catalog")).toHaveAttribute(
      "placeholder",
      SEARCH_PLACEHOLDER,
    );
  });

  it("does not fetch more on an empty result", () => {
    renderScreen({
      rows: [],
      resultCount: 0,
      hasMore: true,
      searchLabel: "zzz",
      total: 0,
    });
    expect(screen.queryByText("Load more")).toBeNull();
    expect(screen.queryByTestId("catalog-load-more")).toBeNull();
    expect(screen.getByText("Nothing matches this search and filter.")).toBeInTheDocument();
  });

  it("does not leave a reserved empty well under no results", () => {
    renderScreen({
      rows: [],
      resultCount: 0,
      hasMore: false,
      searchLabel: "zzz",
      total: 0,
    });
    expect(screen.queryByRole("button", { name: /Sparkling Water/ })).toBeNull();
    expect(screen.queryByTestId("catalog-load-more")).toBeNull();
  });

  it("does not keep a Load more button when there are rows", () => {
    renderScreen({ hasMore: true, rows: [makeProduct()] });
    expect(screen.queryByText("Load more")).toBeNull();
    expect(screen.getByTestId("catalog-load-more")).toBeInTheDocument();
  });

  it("loads the next page when the list hits the threshold", async () => {
    const observers = stubIntersectionObserver();
    const onLoadMore = vi.fn();
    renderScreen({ onLoadMore, hasMore: true, rows: [makeProduct()] });

    await waitFor(() => expect(observers.length).toBeGreaterThan(0));
    observers[0]?.trigger(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("lets the next rows appear without a Loading more line or skeletons", () => {
    const observers = stubIntersectionObserver();
    const onLoadMore = vi.fn();
    renderScreen({
      hasMore: true,
      isLoadingMore: true,
      rows: [makeProduct()],
      onLoadMore,
    });
    expect(screen.queryByTestId("catalog-load-skeletons")).toBeNull();
    expect(screen.queryByText("Loading more…")).toBeNull();
    expect(screen.queryByText("Load more")).toBeNull();
    expect(observers.length).toBeGreaterThan(0);
    observers[0]?.trigger(true);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it("loads another page if the sentinel is still in view after a page lands", async () => {
    const observers = stubIntersectionObserver();
    const onLoadMore = vi.fn();
    const { rerenderScreen } = renderScreen({
      hasMore: true,
      isLoadingMore: true,
      rows: [makeProduct()],
      onLoadMore,
    });

    await waitFor(() => expect(observers.length).toBe(1));
    observers[0]?.trigger(true);
    expect(onLoadMore).not.toHaveBeenCalled();

    rerenderScreen({
      hasMore: true,
      isLoadingMore: false,
      rows: [makeProduct(), makeProduct({ id: 21, name: "Coke Zero" })],
      onLoadMore,
    });

    await waitFor(() => expect(observers.length).toBe(2));
    observers[1]?.trigger(true);
    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it("drops the load sentinel when there is no next page", () => {
    renderScreen({ hasMore: false, rows: [makeProduct()] });
    expect(screen.queryByTestId("catalog-load-more")).toBeNull();
    expect(screen.queryByText("Loading more…")).toBeNull();
    expect(screen.queryByTestId("catalog-load-skeletons")).toBeNull();
  });

  it("does not show the empty-state while stale rows are still on screen", () => {
    renderScreen({
      rows: [makeProduct({ name: "Sparkling Water" })],
      isRefreshing: true,
      searchLabel: "zzz",
      total: 0,
      resultCount: 0,
    });
    expect(screen.getByText("Sparkling Water")).toBeInTheDocument();
    expect(screen.queryByText("Nothing matches this search and filter.")).toBeNull();
  });

  it("renders skeletons instead of a spinner on first load", () => {
    renderScreen({
      isPending: true,
      hasData: false,
      rows: [],
      total: undefined,
    });
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("Sparkling Water")).toBeNull();
    expect(screen.getByText("Loading catalog…")).toBeInTheDocument();
  });

  it("shows a catalog error when the first load fails", () => {
    renderScreen({
      isError: true,
      hasData: false,
      rows: [],
      total: undefined,
    });
    expect(screen.getByText("Couldn’t load the catalog.")).toBeInTheDocument();
  });

  it("says the catalog is busy when the first load is a 429", () => {
    renderScreen({
      isError: true,
      isBusy: true,
      hasData: false,
      rows: [],
      total: undefined,
    });
    expect(
      screen.getByText("Catalog is busy. Try again in a moment."),
    ).toBeInTheDocument();
  });

  it("pauses infinite scroll after a failed page", () => {
    renderScreen({
      isError: true,
      hasData: true,
      hasMore: true,
      rows: [makeProduct()],
    });
    expect(screen.queryByTestId("catalog-load-more")).toBeNull();
  });

  it("opens a row from the list", async () => {
    const user = userEvent.setup();
    const onPick = vi.fn();
    const product = makeProduct({ name: "Coke Zero" });
    renderScreen({ onPick, rows: [product] });
    await user.click(screen.getByRole("button", { name: /Coke Zero/ }));
    expect(onPick).toHaveBeenCalledWith(product);
  });
});
