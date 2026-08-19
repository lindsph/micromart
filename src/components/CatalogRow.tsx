import { Box, Chip, Skeleton, Stack, Typography } from "@mui/material";
import type { Product } from "../api/types";
import type { ImageTreatment } from "../review/chrome";
import { LOW_STOCK } from "../lib/catalogFilters";
import {
  DESKTOP_ROW_GRID,
  displayMoney,
  displayProductName,
  displayQuietLine,
  EMPTY_FIELD,
  ROW_FOCUS_SHADOW,
  ROW_STOCK_COPY,
} from "../review/locks";
import { ProductImage } from "./ProductImage";

const STOCK_CAP = 60;

export type CatalogLayout = "phone" | "tablet" | "desktop";

type CatalogRowProps = {
  product: Product;
  imageSize: number;
  imageTreatment: ImageTreatment;
  onOpen: (product: Product) => void;
  layout?: CatalogLayout;
  selected?: boolean;
};

function stockTone(stock: number | null): string {
  if (stock == null) {
    return "#9AA0A6";
  }
  if (stock === 0) {
    return "#E24B4A";
  }
  if (stock <= LOW_STOCK) {
    return "#E6A23C";
  }
  return "#3D8B6E";
}

function statusLine(product: Product): string {
  if (product.status === "draft") {
    return "Draft · incomplete catalog item";
  }
  if (product.stock === 0) {
    return "Out of stock";
  }
  if (product.stock != null && product.stock <= LOW_STOCK) {
    return "Low stock";
  }
  return displayQuietLine(product.category, product.size);
}

export function CatalogRow({
  product,
  imageSize,
  imageTreatment,
  onOpen,
  layout = "phone",
  selected = false,
}: CatalogRowProps) {
  const tone = stockTone(product.stock);
  const fill = product.stock == null ? 0 : Math.min(1, product.stock / STOCK_CAP);
  const title = displayProductName(product.name);
  const alt = [product.brand, title].filter(Boolean).join(" ");
  const isDraft = product.status === "draft";
  const showStatusDot = layout === "tablet";

  if (layout === "desktop") {
    return (
      <DesktopCatalogRow
        product={product}
        imageSize={imageSize}
        imageTreatment={imageTreatment}
        onOpen={onOpen}
        selected={selected}
        tone={tone}
        fill={fill}
        title={title}
        alt={alt}
        isDraft={isDraft}
      />
    );
  }

  return (
    <Box
      component="button"
      type="button"
      onClick={() => onOpen(product)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        width: "100%",
        textAlign: "left",
        border: 0,
        bgcolor: "background.paper",
        borderRadius: 3,
        px: 1.5,
        py: 1.25,
        minHeight: imageSize + 20,
        cursor: "pointer",
        font: "inherit",
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
        WebkitTapHighlightColor: "transparent",
        outline: "none",
        "&:hover": { bgcolor: "#FAFBFC" },
        "&:active": { bgcolor: "#F3F4F6" },
        "&:focus": { outline: "none" },
        "&:focus-visible": {
          outline: "none",
          boxShadow: ROW_FOCUS_SHADOW,
        },
      }}
    >
      {showStatusDot ? (
        <Box
          data-testid="status-dot"
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: isDraft ? "#8B7A4E" : tone,
            flexShrink: 0,
          }}
          aria-hidden
        />
      ) : null}
      <ProductImage
        src={product.imageUrl}
        alt={alt}
        brand={product.brand}
        name={title}
        category={product.category}
        tags={product.tags}
        size={imageSize}
        treatment={imageTreatment}
      />
      <Stack spacing={0.4} sx={{ minWidth: 0, flex: 1 }}>
        <Typography sx={{ fontWeight: 700, fontSize: imageSize >= 88 ? 17 : 15 }} noWrap>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {product.brand || "No brand"}
        </Typography>
        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
          {isDraft ? (
            <Chip
              size="small"
              label="Draft"
              sx={{ height: 22, bgcolor: "#F4EBD3", color: "#6A5728" }}
            />
          ) : null}
          <Typography variant="caption" color="text.secondary" noWrap>
            {statusLine(product)}
          </Typography>
        </Stack>
      </Stack>
      {isDraft ? null : (
        <Stack spacing={0.5} sx={{ width: 76, flexShrink: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }}>
            {product.stock == null ? (
              EMPTY_FIELD
            ) : (
              <>
                {product.stock}
                <Typography component="span" variant="caption" color="text.secondary">
                  {" "}
                  {ROW_STOCK_COPY}
                </Typography>
              </>
            )}
          </Typography>
          <Box
            sx={{
              height: 4,
              borderRadius: 999,
              bgcolor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${Math.max(product.stock === 0 ? 0.08 : fill, 0) * 100}%`,
                height: "100%",
                bgcolor: tone,
              }}
            />
          </Box>
        </Stack>
      )}
      <Typography
        sx={{
          fontWeight: 700,
          width: 58,
          textAlign: "right",
          fontSize: 14,
        }}
      >
        {displayMoney(product.price)}
      </Typography>
    </Box>
  );
}

function DesktopCatalogRow({
  product,
  imageSize,
  imageTreatment,
  onOpen,
  selected,
  tone,
  fill,
  title,
  alt,
  isDraft,
}: {
  product: Product;
  imageSize: number;
  imageTreatment: ImageTreatment;
  onOpen: (product: Product) => void;
  selected: boolean;
  tone: string;
  fill: number;
  title: string;
  alt: string;
  isDraft: boolean;
}) {
  return (
    <Box
      component="button"
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={() => onOpen(product)}
      sx={{
        display: "grid",
        gridTemplateColumns: DESKTOP_ROW_GRID,
        alignItems: "center",
        columnGap: 2,
        width: "100%",
        textAlign: "left",
        border: 0,
        bgcolor: selected ? "#EEF3FA" : "background.paper",
        borderRadius: 2,
        px: 1.5,
        py: 1,
        minHeight: imageSize + 16,
        cursor: "pointer",
        font: "inherit",
        boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)",
        outline: "none",
        "&:hover": { bgcolor: selected ? "#E4ECF7" : "#FAFBFC" },
        "&:focus": { outline: "none" },
        "&:focus-visible": {
          outline: "none",
          boxShadow: ROW_FOCUS_SHADOW,
        },
      }}
    >
      <ProductImage
        src={product.imageUrl}
        alt={alt}
        brand={product.brand}
        name={title}
        category={product.category}
        tags={product.tags}
        size={imageSize}
        treatment={imageTreatment}
      />
      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
          {title}
        </Typography>
        <Typography variant="caption" color="text.secondary" noWrap>
          {product.brand || "No brand"}
        </Typography>
        {isDraft ? (
          <Chip
            size="small"
            label="Draft"
            sx={{
              height: 20,
              width: "fit-content",
              bgcolor: "#F4EBD3",
              color: "#6A5728",
            }}
          />
        ) : null}
      </Stack>
      <Typography variant="body2" noWrap>
        {product.sku.trim() || EMPTY_FIELD}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        {isDraft ? "Draft · incomplete" : displayQuietLine(product.category, product.size)}
      </Typography>
      {isDraft ? (
        <Typography variant="body2" color="text.secondary">
          {EMPTY_FIELD}
        </Typography>
      ) : (
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="caption" sx={{ fontWeight: 600 }} noWrap>
            {product.stock == null ? (
              EMPTY_FIELD
            ) : (
              <>
                {product.stock}
                <Typography component="span" variant="caption" color="text.secondary">
                  {" "}
                  {ROW_STOCK_COPY}
                </Typography>
              </>
            )}
          </Typography>
          <Box
            sx={{
              height: 4,
              borderRadius: 999,
              bgcolor: "divider",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                width: `${Math.max(product.stock === 0 ? 0.08 : fill, 0) * 100}%`,
                height: "100%",
                bgcolor: tone,
              }}
            />
          </Box>
        </Stack>
      )}
      <Typography sx={{ fontWeight: 700, fontSize: 14, textAlign: "right" }}>
        {displayMoney(product.price)}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ textAlign: "right" }}
      >
        {displayMoney(product.cost)}
      </Typography>
    </Box>
  );
}

export function CatalogRowSkeleton({
  imageSize,
  layout = "phone",
}: {
  imageSize: number;
  layout?: CatalogLayout;
}) {
  if (layout === "desktop") {
    return (
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: DESKTOP_ROW_GRID,
          alignItems: "center",
          columnGap: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          px: 1.5,
          py: 1,
        }}
      >
        <Skeleton variant="rounded" width={imageSize} height={imageSize} />
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Skeleton variant="rounded" width="70%" height={14} />
          <Skeleton variant="rounded" width="40%" height={10} />
        </Stack>
        <Skeleton variant="rounded" width="80%" height={12} />
        <Skeleton variant="rounded" width="70%" height={12} />
        <Skeleton variant="rounded" width="90%" height={12} />
        <Skeleton variant="rounded" width="70%" height={12} />
        <Skeleton variant="rounded" width="70%" height={12} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        bgcolor: "background.paper",
        borderRadius: 3,
        px: 1.5,
        py: 1.25,
      }}
    >
      {layout === "tablet" ? (
        <Skeleton variant="circular" width={8} height={8} />
      ) : null}
      <Skeleton variant="rounded" width={imageSize} height={imageSize} />
      <Stack spacing={0.75} sx={{ minWidth: 0, flex: 1 }}>
        <Skeleton variant="rounded" width="72%" height={14} />
        <Skeleton variant="rounded" width="38%" height={10} />
        <Skeleton variant="rounded" width="52%" height={10} />
      </Stack>
      <Stack spacing={0.75} sx={{ width: 76 }}>
        <Skeleton variant="rounded" width="100%" height={10} />
        <Skeleton variant="rounded" width="100%" height={4} />
      </Stack>
      <Skeleton variant="rounded" width={44} height={14} />
    </Box>
  );
}
