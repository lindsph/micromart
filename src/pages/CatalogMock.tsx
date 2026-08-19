import { Box, Tab, Tabs } from "@mui/material";
import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { isRateLimitError } from "../api/errors";
import { fetchCategories, fetchHealth, fetchProduct, fetchProductList } from "../api/products";
import { nextListPageParam } from "../api/query";
import type { Product } from "../api/types";
import { CatalogScreen, type SortChoice } from "../components/CatalogScreen";
import { ConnectionBanner } from "../components/ConnectionBanner";
import {
  ProductInspectDialog,
  releaseInspectLock,
} from "../components/ProductInspectDialog";
import { ProductInspect } from "../components/ProductInspect";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import { FEATURED_BRANDS, liveListSearch, sortParams } from "../lib/catalogFilters";
import {
  DESKTOP_INSPECT_WIDTH,
  DEVICES,
  HEADING_STYLE,
  IMAGE_TREATMENT,
  PAGE_SIZE,
  SEARCH_DEBOUNCE_MS,
  THUMB_SIZE,
  type DeviceId,
} from "../review/locks";

export function CatalogMock() {
  const [deviceId, setDeviceId] = useState<DeviceId>("se");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState<SortChoice>("name-asc");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const listSearch = liveListSearch(search, debouncedSearch);
  const online = useOnlineStatus();
  const { sort: sortField, order } = sortParams(sort);
  const device = DEVICES.find((item) => item.id === deviceId) ?? DEVICES[0];

  const health = useQuery({
    queryKey: ["health"],
    queryFn: ({ signal }) => fetchHealth(signal),
    retry: false,
  });

  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: ({ signal }) => fetchCategories(signal),
  });

  const detail = useQuery({
    queryKey: ["product", openProduct?.id],
    queryFn: ({ signal }) => fetchProduct(openProduct!.id, signal),
    enabled: openProduct != null,
    staleTime: 0,
    retry: false,
  });

  const catalog = useInfiniteQuery({
    queryKey: ["catalog-mock", listSearch, category, brand, sort],
    initialPageParam: { page: 1 },
    queryFn: ({ pageParam, signal }) =>
      fetchProductList(
        {
          search: listSearch || undefined,
          category: category || undefined,
          brand: brand || undefined,
          limit: PAGE_SIZE,
          sort: sortField,
          order,
          ...(pageParam.cursor
            ? { cursor: pageParam.cursor }
            : { page: pageParam.page ?? 1 }),
        },
        signal,
      ),
    getNextPageParam: nextListPageParam,
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(
    () => catalog.data?.pages.flatMap((page) => page.data) ?? [],
    [catalog.data],
  );

  const total = catalog.data?.pages[0]?.total;

  const screenProps = {
    search,
    onSearchChange: setSearch,
    onPick: (product: Product) => setOpenProduct(product),
    category,
    categories: categories.data ?? [],
    onCategory: setCategory,
    brand,
    brands: [...FEATURED_BRANDS],
    onBrand: setBrand,
    sort,
    onSort: setSort,
    imageSize: THUMB_SIZE,
    imageTreatment: IMAGE_TREATMENT,
    headingStyle: HEADING_STYLE,
    resultCount: rows.length,
    total,
    searchLabel: listSearch,
    rows,
    isPending: catalog.isPending,
    isError: catalog.isError,
    isBusy: isRateLimitError(catalog.error),
    hasData: catalog.data !== undefined,
    hasMore: Boolean(catalog.hasNextPage) && rows.length > 0,
    isLoadingMore: catalog.isFetchingNextPage,
    isRefreshing: catalog.isPlaceholderData,
    selectedId: openProduct?.id,
    showSkeletons: false,
    onLoadMore: () => {
      void catalog.fetchNextPage();
    },
  };

  const framed = device.layout !== "desktop";

  useEffect(() => {
    if (framed || !openProduct) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenProduct(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [framed, openProduct]);

  return (
    <Box
      sx={{
        bgcolor: "#E9EAEE",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexShrink: 0, px: 2, pt: 2, pb: 1.5 }}>
        <Tabs
          value={device.id}
          onChange={(_, next: DeviceId) => {
            releaseInspectLock(frameRef.current);
            setDeviceId(next);
            setOpenProduct(null);
          }}
          aria-label="Device preview"
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 40,
            "& .MuiTab-root": {
              minHeight: 40,
              textTransform: "none",
              fontWeight: 650,
            },
          }}
        >
          {DEVICES.map((item) => (
            <Tab key={item.id} value={item.id} label={item.label} />
          ))}
        </Tabs>
        <Box sx={{ mt: 1.5 }}>
          <ConnectionBanner
            online={online}
            isError={catalog.isError}
            filtersError={categories.isError && !catalog.isError}
            apiUnreachable={health.isError && catalog.isError}
            isBusy={
              isRateLimitError(catalog.error) ||
              isRateLimitError(categories.error)
            }
            isFetching={
              (catalog.isFetching && !catalog.isFetchingNextPage) ||
              categories.isFetching ||
              health.isFetching
            }
            hasData={catalog.data !== undefined}
            onRetry={() => {
              void catalog.refetch();
              void categories.refetch();
              void health.refetch();
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: framed ? "auto" : "hidden",
          px: 2,
          pb: 2,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: framed ? "center" : "stretch",
            width: "100%",
            height: framed ? "auto" : "100%",
          }}
        >
          <Box
            ref={frameRef}
            data-testid="device-frame"
            data-device={device.id}
            sx={
              framed
                ? {
                    width: device.width,
                    height: device.height,
                    position: "relative",
                    bgcolor: "background.default",
                    border: "8px solid #1A1C1B",
                    borderRadius: device.layout === "tablet" ? 3 : 5,
                    overflow: "hidden",
                    boxShadow: "0 16px 40px rgba(16, 24, 40, 0.12)",
                    display: "flex",
                    flexDirection: "column",
                    flexShrink: 0,
                    transition:
                      "width 240ms ease, height 240ms ease, border-radius 240ms ease",
                  }
                : {
                    width: "100%",
                    height: "100%",
                    minHeight: 560,
                    position: "relative",
                    bgcolor: "background.default",
                    border: 0,
                    borderRadius: 2,
                    overflow: "hidden",
                    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.06)",
                    display: "flex",
                    flexDirection: "row",
                    flexShrink: 1,
                  }
            }
          >
            {framed ? (
              <Box
                sx={{
                  height: device.layout === "tablet" ? 20 : 28,
                  flexShrink: 0,
                  bgcolor: "background.default",
                }}
              />
            ) : null}
            <Box sx={{ flex: 1, minWidth: 0, minHeight: 0 }}>
              <CatalogScreen layout={device.layout} {...screenProps} />
            </Box>
            {framed ? (
              <Box
                data-testid="inspect-layer"
                sx={{
                  position: "absolute",
                  inset: 0,
                  pointerEvents: openProduct ? "auto" : "none",
                }}
              >
                <ProductInspectDialog
                  product={detail.data ?? openProduct}
                  fromList={Boolean(openProduct) && detail.isError}
                  kind={device.inspect}
                  onClose={() => {
                    releaseInspectLock(frameRef.current);
                    setOpenProduct(null);
                  }}
                />
              </Box>
            ) : (
              <Box
                data-testid="inspect-layer"
                data-inspect-kind="panel"
                sx={{
                  width: openProduct ? DESKTOP_INSPECT_WIDTH : 0,
                  flexShrink: 0,
                  overflow: "auto",
                  borderLeft: openProduct ? "1px solid" : 0,
                  borderColor: "divider",
                  pointerEvents: openProduct ? "auto" : "none",
                  bgcolor: "background.paper",
                }}
              >
                {openProduct ? (
                  <ProductInspect
                    product={detail.data ?? openProduct}
                    fromList={detail.isError}
                    imageTreatment={IMAGE_TREATMENT}
                    onClose={() => setOpenProduct(null)}
                  />
                ) : null}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
