import { Dialog, Fade, Slide } from "@mui/material";
import type { TransitionProps } from "@mui/material/transitions";
import { forwardRef, type ReactElement, type Ref } from "react";
import type { Product } from "../api/types";
import {
  IMAGE_TREATMENT,
  INSPECT_CARD_FRAME,
  INSPECT_CARD_PAPER,
  INSPECT_DIALOG_FLAGS,
  INSPECT_SHEET_PAPER,
  type InspectKind,
} from "../review/locks";
import { ProductInspect } from "./ProductInspect";

export type { InspectKind };

const SheetSlide = forwardRef(function SheetSlide(
  props: TransitionProps & { children: ReactElement },
  ref: Ref<unknown>,
) {
  return <Slide ref={ref} {...props} direction="up" />;
});

type ProductInspectDialogProps = {
  product: Product | null;
  fromList?: boolean;
  kind: InspectKind;
  onClose: () => void;
};

export function releaseInspectLock(frame: HTMLElement | null) {
  if (!frame) {
    return;
  }
  const pane = frame.querySelector<HTMLElement>("[data-testid='catalog-scroll']");
  const top = pane?.scrollTop ?? 0;
  for (const node of frame.querySelectorAll("[inert]")) {
    if (!(node instanceof HTMLElement)) {
      continue;
    }
    if (node.closest("[data-testid='inspect-layer']")) {
      continue;
    }
    node.inert = false;
    node.removeAttribute("inert");
  }
  const catalog = frame.querySelector<HTMLElement>("[data-catalog-screen]");
  if (catalog) {
    catalog.removeAttribute("aria-hidden");
    catalog.inert = false;
    catalog.parentElement?.removeAttribute("aria-hidden");
    if (catalog.parentElement) {
      catalog.parentElement.inert = false;
    }
  }
  if (pane) {
    pane.scrollTop = top;
  }
}

export function ProductInspectDialog({
  product,
  fromList = false,
  kind,
  onClose,
}: ProductInspectDialogProps) {
  return (
    <Dialog
      open={Boolean(product)}
      onClose={onClose}
      {...INSPECT_DIALOG_FLAGS}
      slots={{ transition: kind === "sheet" ? SheetSlide : Fade }}
      slotProps={{
        backdrop: { sx: { position: "absolute" } },
        paper: { sx: kind === "sheet" ? INSPECT_SHEET_PAPER : INSPECT_CARD_PAPER },
        transition: {
          onExited: (node) => {
            const root = node instanceof HTMLElement ? node : null;
            releaseInspectLock(
              root?.closest<HTMLElement>("[data-testid='device-frame']") ?? null,
            );
          },
        },
      }}
      sx={{
        position: "absolute",
        inset: 0,
        "& .MuiDialog-container":
          kind === "sheet"
            ? {
                alignItems: "stretch",
                justifyContent: "center",
              }
            : INSPECT_CARD_FRAME,
      }}
      aria-labelledby="product-inspect-title"
      data-inspect-kind={kind}
    >
      {product ? (
        <ProductInspect
          product={product}
          fromList={fromList}
          imageTreatment={IMAGE_TREATMENT}
          onClose={onClose}
        />
      ) : null}
    </Dialog>
  );
}
