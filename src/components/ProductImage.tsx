import { Box } from "@mui/material";
import { useState } from "react";
import { safeImageUrl, type ImagePad } from "../lib/safeImageUrl";
import type { ImageTreatment } from "../review/chrome";
import { ProductPlaceholder } from "./ProductPlaceholder";

type ProductImageProps = {
  src: string;
  alt: string;
  brand?: string;
  name?: string;
  category?: string;
  tags?: string[];
  size: number;
  priority?: boolean;
  treatment?: ImageTreatment;
  framed?: boolean;
};

const WELL: Record<
  ImageTreatment,
  { pad: ImagePad; inset: number; bgcolor: string; border: string; fit: "contain" | "cover" }
> = {
  "soft-pad": {
    pad: "matte",
    inset: 6,
    bgcolor: "#F4F1EA",
    border: "1px solid rgba(40, 34, 28, 0.08)",
    fit: "contain",
  },
  "white-tile": {
    pad: "white",
    inset: 6,
    bgcolor: "#FFFFFF",
    border: "1px solid #E8E6E1",
    fit: "contain",
  },
  cover: {
    pad: "none",
    inset: 0,
    bgcolor: "#F4F1EA",
    border: "1px solid rgba(40, 34, 28, 0.08)",
    fit: "cover",
  },
};

export function ProductImage({
  src,
  alt,
  brand = "",
  name = "",
  category = "",
  tags = [],
  size,
  priority = false,
  treatment = "white-tile",
  framed = true,
}: ProductImageProps) {
  const well = WELL[treatment];
  const safeSrc = safeImageUrl(src, size, well.pad);
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = !safeSrc || failedSrc === safeSrc;
  const inset = framed && !failed ? well.inset : 0;

  return (
    <Box
      data-framed={framed ? "true" : "false"}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: framed ? 2.5 : 0,
        overflow: "hidden",
        bgcolor: failed ? undefined : well.bgcolor,
        border: framed && !failed ? well.border : 0,
        p: inset ? `${inset}px` : 0,
        boxSizing: "border-box",
      }}
    >
      {failed || !safeSrc ? (
        <ProductPlaceholder
          category={category}
          tags={tags}
          size={size}
          label={`${alt || brand || name || "Product"}, package photo not on file`}
        />
      ) : (
        <Box
          component="img"
          src={safeSrc}
          alt={alt}
          width={size - inset * 2}
          height={size - inset * 2}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailedSrc(safeSrc)}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: well.fit,
            objectPosition: "center",
            display: "block",
          }}
        />
      )}
    </Box>
  );
}
