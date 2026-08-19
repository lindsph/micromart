import { Box, Button, Divider, Stack, Typography } from "@mui/material";
import type { Product } from "../api/types";
import type { ImageTreatment } from "../review/chrome";
import { LOW_STOCK } from "../lib/catalogFilters";
import {
  DETAIL_STOCK_COPY,
  EMPTY_FIELD,
  INSPECT_IMAGE_FRAMED,
  INSPECT_IMAGE_SIZE,
  INSPECT_PAD,
  displayField,
  displayMargin,
  displayMoney,
  displayProductName,
  displaySize,
} from "../review/locks";
import { ProductImage } from "./ProductImage";

type ProductInspectProps = {
  product: Product;
  fromList?: boolean;
  imageTreatment: ImageTreatment;
  onClose: () => void;
};

function stockLine(product: Product): string {
  if (product.stock == null) {
    return EMPTY_FIELD;
  }
  if (product.stock === 0) {
    return "Out of stock";
  }
  if (product.stock <= LOW_STOCK) {
    return `Low stock · ${product.stock} ${DETAIL_STOCK_COPY}`;
  }
  return `${product.stock} ${DETAIL_STOCK_COPY}`;
}

export function ProductInspect({
  product,
  fromList = false,
  imageTreatment,
  onClose,
}: ProductInspectProps) {
  const isDraft = product.status === "draft";
  const title = displayProductName(product.name);
  const alt = [product.brand, title].filter(Boolean).join(" ");

  return (
    <Stack data-testid="product-inspect" sx={INSPECT_PAD}>
      <Stack
        direction="row"
        sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}
      >
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 650,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "text.secondary",
          }}
        >
          Product
        </Typography>
        <Button autoFocus onClick={onClose} size="small" sx={{ mr: -1 }}>
          Close
        </Button>
      </Stack>

      <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
        <ProductImage
          src={product.imageUrl}
          alt={alt}
          brand={product.brand}
          name={title}
          category={product.category}
          tags={product.tags}
          size={INSPECT_IMAGE_SIZE}
          treatment={imageTreatment}
          framed={INSPECT_IMAGE_FRAMED}
          priority
        />
      </Box>

      <Typography
        id="product-inspect-title"
        sx={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", mb: 0.5 }}
      >
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 1.5 }}>
        {product.brand || "No brand"}
      </Typography>

      <Typography
        sx={{
          fontWeight: 650,
          fontSize: 13,
          mb: 1.5,
          color: isDraft ? "#6A5728" : undefined,
        }}
      >
        {isDraft ? "Draft · incomplete catalog item" : stockLine(product)}
      </Typography>
      {fromList ? (
        <Typography
          color="text.secondary"
          sx={{ fontSize: 12, mb: 1.5, mt: -0.75 }}
        >
          Could not refresh. This is the list snapshot.
        </Typography>
      ) : null}

      <Stack
        direction="row"
        sx={{ justifyContent: "space-between", alignItems: "baseline", mb: 2 }}
      >
        <Typography sx={{ fontWeight: 700, fontSize: 20 }}>
          {displayMoney(product.price)}
        </Typography>
        <Typography color="text.secondary">
          {displaySize(product.size)}
        </Typography>
      </Stack>

      <Divider sx={{ mb: 2 }} />

      <Stack spacing={1.25}>
        <Fact label="SKU" value={displayField(product.sku)} />
        <Fact label="Cost" value={displayMoney(product.cost)} />
        <Fact label="Margin" value={displayMargin(product.price, product.cost)} />
        <Fact label="Category" value={displayField(product.category)} />
        {product.tags.length > 0 ? (
          <Fact label="Tags" value={product.tags.join(" · ")} />
        ) : null}
        {product.description.trim() ? (
          <Stack spacing={0.5} sx={{ pt: 0.5 }}>
            <Typography color="text.secondary" sx={{ fontSize: 12 }}>
              Description
            </Typography>
            <Typography>{product.description}</Typography>
          </Stack>
        ) : null}
      </Stack>
    </Stack>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2 }}>
      <Typography color="text.secondary" sx={{ fontSize: 12, flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography sx={{ textAlign: "right" }}>{value}</Typography>
    </Stack>
  );
}
