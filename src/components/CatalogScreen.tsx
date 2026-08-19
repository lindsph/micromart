import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import {
  Alert,
  Box,
  Chip,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import type { Product } from "../api/types";
import { type SortChoice } from "../lib/catalogFilters";
import type { HeadingStyle, ImageTreatment } from "../review/chrome";
import {
  DESKTOP_ROW_GRID,
  FIND_BAR_SHADOW,
  LOAD_MORE_ROOT_MARGIN,
  SORT_SPLIT_COLOR,
} from "../review/locks";
import { CatalogRow, CatalogRowSkeleton, type CatalogLayout } from "./CatalogRow";
import { CatalogSearch } from "./CatalogSearch";

export type { SortChoice };

export type CatalogScreenProps = {
  layout: CatalogLayout;
  selectedId?: number | null;
  search: string;
  onSearchChange: (value: string) => void;
  onPick: (product: Product) => void;
  category: string;
  categories: string[];
  onCategory: (value: string) => void;
  brand: string;
  brands: string[];
  onBrand: (value: string) => void;
  sort: SortChoice;
  onSort: (value: SortChoice) => void;
  imageSize: number;
  imageTreatment: ImageTreatment;
  headingStyle: HeadingStyle;
  resultCount: number;
  total?: number;
  searchLabel: string;
  rows: Product[];
  isPending: boolean;
  isError: boolean;
  isBusy?: boolean;
  hasData: boolean;
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  showSkeletons?: boolean;
  isRefreshing?: boolean;
};

const SORT_OPTIONS: { id: SortChoice; label: string; short: string }[] = [
  { id: "name-asc", label: "Name A–Z", short: "A–Z" },
  { id: "name-desc", label: "Name Z–A", short: "Z–A" },
  { id: "price-asc", label: "Price · low to high", short: "$ low" },
  { id: "price-desc", label: "Price · high to low", short: "$ high" },
  { id: "stock-asc", label: "Stock · lowest first", short: "Stock" },
  { id: "newest", label: "Newest", short: "New" },
];

export function CatalogScreen({
  layout,
  selectedId = null,
  search,
  onSearchChange,
  onPick,
  category,
  categories,
  onCategory,
  brand,
  brands,
  onBrand,
  sort,
  onSort,
  imageSize,
  imageTreatment,
  headingStyle,
  resultCount,
  total,
  searchLabel,
  rows,
  isPending,
  isError,
  isBusy = false,
  hasData,
  hasMore,
  isLoadingMore,
  onLoadMore,
  showSkeletons = false,
  isRefreshing = false,
}: CatalogScreenProps) {
  const wide = layout !== "phone";
  const listRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const onLoadMoreRef = useRef(onLoadMore);
  const loadingMoreRef = useRef(isLoadingMore);
  onLoadMoreRef.current = onLoadMore;
  loadingMoreRef.current = isLoadingMore;
  const [compactFind, setCompactFind] = useState(false);
  const [sortAnchor, setSortAnchor] = useState<HTMLElement | null>(null);
  const [brandAnchor, setBrandAnchor] = useState<HTMLElement | null>(null);
  const sortLabel =
    SORT_OPTIONS.find((option) => option.id === sort)?.short ?? "A–Z";
  const brandLabel = brand || "Brand";

  const countLine = (() => {
    if (total == null) {
      return "Loading catalog…";
    }
    if (searchLabel) {
      return `${total} result${total === 1 ? "" : "s"} for “${searchLabel}”`;
    }
    if (brand) {
      return `${total} ${brand}`;
    }
    return `Showing ${resultCount} of ${total}`;
  })();
  const shownCount = useRef(countLine);
  if (!isRefreshing) {
    shownCount.current = countLine;
  }

  const listKey = `${searchLabel}|${category}|${brand}|${sort}`;
  const settledListKey = useRef(listKey);
  useEffect(() => {
    if (isRefreshing) {
      return;
    }
    if (settledListKey.current === listKey) {
      return;
    }
    settledListKey.current = listKey;
    const pane = listRef.current;
    if (pane) {
      if (typeof pane.scrollTo === "function") {
        pane.scrollTo({ top: 0 });
      } else {
        pane.scrollTop = 0;
      }
    }
    setCompactFind(false);
  }, [isRefreshing, listKey]);

  useEffect(() => {
    const heading = headingRef.current;
    const root = listRef.current;
    if (!heading || !root) {
      return;
    }

    let frame = 0;
    const update = () => {
      const threshold = heading.offsetHeight;
      const top = root.scrollTop;
      setCompactFind((prev) => {
        if (threshold <= 0) {
          return false;
        }
        if (prev) {
          return top > threshold - 20;
        }
        return top > threshold + 8;
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };

    root.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      root.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, [layout]);

  const canLoadMore = hasMore && rows.length > 0 && !showSkeletons && !isError;
  // Recreate the observer when a page settles so a still-visible sentinel can load the next one.
  useEffect(() => {
    const root = listRef.current;
    const target = loadMoreRef.current;
    if (!canLoadMore || !root || !target) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMoreRef.current) {
          onLoadMoreRef.current();
        }
      },
      { root, rootMargin: LOAD_MORE_ROOT_MARGIN, threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, isLoadingMore]);

  return (
    <Box
      data-catalog-screen
      sx={{
        px: wide ? 2.5 : 1.75,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        ref={listRef}
        data-testid="catalog-scroll"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          overflowX: "hidden",
          overscrollBehavior: "contain",
          pb: wide ? 2.5 : 1.75,
        }}
      >
        <Box
          ref={headingRef}
          data-testid="catalog-heading"
          sx={{ bgcolor: "background.default" }}
        >
          <CatalogHeading
            roomy={wide}
            style={headingStyle}
            countLine={shownCount.current}
          />
        </Box>

        <StickyFindBar
          compact={compactFind}
          inset={wide ? 2.5 : 1.75}
          search={search}
          onSearchChange={onSearchChange}
        />

        <Box sx={{ mb: 1.5, pt: 1.25 }}>
          <ChipRail wrap={wide}>
            <Chip
              clickable
              size="small"
              variant="outlined"
              aria-label="Sort catalog"
              aria-haspopup="menu"
              aria-expanded={Boolean(sortAnchor)}
              onClick={(event: MouseEvent<HTMLDivElement>) => {
                setSortAnchor(event.currentTarget);
              }}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                  {sortLabel}
                  <KeyboardArrowDownIcon
                    sx={{
                      fontSize: 18,
                      mr: -0.5,
                      color: "text.primary",
                    }}
                  />
                </Box>
              }
              sx={{
                flexShrink: 0,
                minWidth: 72,
                fontWeight: 650,
                bgcolor: "#F3F4F6",
                borderColor: "#5F656C",
                borderWidth: 1.5,
                "& .MuiChip-label": { pr: 0.75 },
              }}
            />
            <Menu
              anchorEl={sortAnchor}
              open={Boolean(sortAnchor)}
              onClose={() => setSortAnchor(null)}
            >
              {SORT_OPTIONS.map((option) => (
                <MenuItem
                  key={option.id}
                  selected={sort === option.id}
                  onClick={() => {
                    onSort(option.id);
                    setSortAnchor(null);
                  }}
                >
                  {option.label}
                </MenuItem>
              ))}
            </Menu>
            {brands.length > 0 ? (
              <>
                <Chip
                  clickable
                  size="small"
                  variant={brand ? "filled" : "outlined"}
                  color={brand ? "primary" : "default"}
                  aria-label="Filter by brand"
                  aria-haspopup="menu"
                  aria-expanded={Boolean(brandAnchor)}
                  onClick={(event: MouseEvent<HTMLDivElement>) => {
                    setBrandAnchor(event.currentTarget);
                  }}
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.25 }}>
                      {brandLabel}
                      <KeyboardArrowDownIcon
                        sx={{
                          fontSize: 18,
                          mr: -0.5,
                          color: brand ? "inherit" : "text.primary",
                        }}
                      />
                    </Box>
                  }
                  sx={{
                    flexShrink: 0,
                    fontWeight: 650,
                    bgcolor: brand ? undefined : "#F3F4F6",
                    borderColor: brand ? undefined : "#5F656C",
                    borderWidth: 1.5,
                    "& .MuiChip-label": { pr: 0.75 },
                  }}
                />
                <Menu
                  anchorEl={brandAnchor}
                  open={Boolean(brandAnchor)}
                  onClose={() => setBrandAnchor(null)}
                >
                  <MenuItem
                    selected={!brand}
                    onClick={() => {
                      onBrand("");
                      setBrandAnchor(null);
                    }}
                  >
                    All brands
                  </MenuItem>
                  {brands.map((item) => (
                    <MenuItem
                      key={item}
                      selected={brand === item}
                      onClick={() => {
                        onBrand(brand === item ? "" : item);
                        setBrandAnchor(null);
                      }}
                    >
                      {item}
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : null}
            {categories.length > 0 ? (
              <ChipSplit testId="sort-filter-split" />
            ) : null}
            {categories.map((item) => (
              <Chip
                key={item}
                label={item}
                clickable
                size="small"
                onClick={() => onCategory(category === item ? "" : item)}
                variant={category === item ? "filled" : "outlined"}
                color={category === item ? "primary" : "default"}
                sx={{ flexShrink: 0 }}
              />
            ))}
          </ChipRail>
        </Box>

        {showSkeletons || (isPending && !hasData) ? (
          <Stack spacing={1}>
            {Array.from({ length: 6 }, (_, index) => (
              <CatalogRowSkeleton key={index} imageSize={imageSize} layout={layout} />
            ))}
          </Stack>
        ) : null}

        {isError && !hasData && !showSkeletons ? (
          <Alert severity="error">
            {isBusy
              ? "Catalog is busy. Try again in a moment."
              : "Couldn’t load the catalog."}
          </Alert>
        ) : null}

        {hasData && rows.length === 0 && !showSkeletons && !isRefreshing ? (
          <Alert severity="info">
            Nothing matches this search and filter.
          </Alert>
        ) : null}

        {showSkeletons || rows.length === 0 ? null : (
          <Stack
            spacing={1}
            sx={{
              opacity: isRefreshing ? 0.72 : 1,
              transition: "opacity 120ms linear",
            }}
          >
            {layout === "desktop" ? <DesktopColumnHeader /> : null}
            {rows.map((product) => (
              <CatalogRow
                key={product.id}
                product={product}
                imageSize={imageSize}
                imageTreatment={imageTreatment}
                layout={layout}
                selected={selectedId === product.id}
                onOpen={onPick}
              />
            ))}
          </Stack>
        )}

        {canLoadMore ? (
          <Box
            ref={loadMoreRef}
            data-testid="catalog-load-more"
            aria-hidden
            sx={{ height: 1 }}
          />
        ) : null}
      </Box>
    </Box>
  );
}

export function StickyFindBar({
  compact,
  search,
  onSearchChange,
  inset = 1.75,
}: {
  compact: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  inset?: number;
}) {
  return (
    <Box
      data-testid="catalog-sticky-search"
      data-compact={compact ? "true" : "false"}
      sx={{
        position: "sticky",
        top: 0,
        zIndex: 2,
        bgcolor: "background.default",
        mx: -inset,
        px: inset,
        pt: compact ? 1.5 : 1.25,
        pb: compact ? 1.25 : 1,
        mb: 0.25,
        boxShadow: compact ? FIND_BAR_SHADOW : "none",
        transition: "box-shadow 180ms ease, padding 180ms ease",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <Typography
          aria-hidden
          data-testid="sticky-products-label"
          sx={{
            fontWeight: 650,
            fontSize: 15,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            maxWidth: compact ? 80 : 0,
            opacity: compact ? 1 : 0,
            mr: compact ? 1 : 0,
            transition:
              "max-width 180ms ease, opacity 160ms ease, margin 180ms ease",
          }}
        >
          Products
        </Typography>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CatalogSearch value={search} onValueChange={onSearchChange} />
        </Box>
      </Box>
    </Box>
  );
}

function CatalogHeading({
  roomy,
  style,
  countLine,
}: {
  roomy: boolean;
  style: HeadingStyle;
  countLine: string;
}) {
  const top = roomy ? 2 : 1.75;

  if (style === "quiet") {
    return (
      <Box
        component="h1"
        sx={{
          m: 0,
          mb: 1.75,
          pt: top,
          fontSize: roomy ? 18 : 15,
          fontWeight: 650,
          letterSpacing: "-0.015em",
          lineHeight: 1.3,
        }}
      >
        {countLine}
      </Box>
    );
  }

  if (style === "inline") {
    return (
      <Stack
        direction="row"
        sx={{
          mb: 1.75,
          pt: top,
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 1,
        }}
      >
        <Box
          component="h1"
          sx={{
            m: 0,
            fontSize: roomy ? 22 : 17,
            fontWeight: 650,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Products
        </Box>
        <Typography color="text.secondary" sx={{ fontSize: roomy ? 14 : 12, minHeight: 20 }} noWrap>
          {countLine}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={style === "eyebrow" ? 0.35 : 0.5} sx={{ mb: 1.75, pt: top }}>
      {style === "eyebrow" ? (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          Catalog
        </Typography>
      ) : null}
      <Box
        component="h1"
        sx={{
          m: 0,
          fontSize:
            style === "page" ? (roomy ? 26 : 20) : roomy ? 22 : 17,
          fontWeight: style === "page" ? 700 : 650,
          letterSpacing: "-0.02em",
          lineHeight: 1.2,
        }}
      >
        Products
      </Box>
      <Typography
        color="text.secondary"
        noWrap
        sx={{ fontSize: roomy ? 14 : 13, minHeight: 20 }}
      >
        {countLine}
      </Typography>
    </Stack>
  );
}

function ChipSplit({ testId }: { testId: string }) {
  return (
    <Box
      aria-hidden
      data-testid={testId}
      sx={{
        width: "1px",
        height: 20,
        bgcolor: SORT_SPLIT_COLOR,
        borderRadius: 1,
        flexShrink: 0,
        alignSelf: "center",
        mx: 0.25,
      }}
    />
  );
}

function DesktopColumnHeader() {
  return (
    <Box
      data-testid="desktop-column-header"
      aria-hidden
      sx={{
        display: "grid",
        gridTemplateColumns: DESKTOP_ROW_GRID,
        columnGap: 2,
        px: 1.5,
        pb: 0.5,
        color: "text.secondary",
        fontSize: 11,
        fontWeight: 650,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}
    >
      <span />
      <span>Name</span>
      <span>SKU</span>
      <span>Category</span>
      <span>Stock</span>
      <span style={{ textAlign: "right" }}>Price</span>
      <span style={{ textAlign: "right" }}>Cost</span>
    </Box>
  );
}

function ChipRail({
  wrap,
  children,
}: {
  wrap: boolean;
  children: ReactNode;
}) {
  return (
    <Stack
      data-testid="catalog-chip-rail"
      direction="row"
      useFlexGap
      sx={{
        flex: wrap ? 1 : undefined,
        flexWrap: wrap ? "wrap" : "nowrap",
        overflowX: wrap ? "visible" : "auto",
        gap: 1,
        minHeight: 32,
        pb: wrap ? 0 : 0.25,
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
      }}
    >
      {children}
    </Stack>
  );
}
