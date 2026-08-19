export const IMAGE_TREATMENTS = [
  {
    id: "soft-pad",
    label: "Soft pad",
    hint: "Recommended · whole pack, no crop",
  },
  {
    id: "white-tile",
    label: "White tile",
    hint: "SKU photo on white",
  },
  {
    id: "cover",
    label: "Cover crop",
    hint: "Current · chops tall packs",
  },
] as const;

export type ImageTreatment = (typeof IMAGE_TREATMENTS)[number]["id"];

export const HEADING_STYLES = [
  {
    id: "nav",
    label: "Nav title",
    hint: "17px, more air under the bezel",
  },
  {
    id: "inline",
    label: "Inline count",
    hint: "Products + 20 of 251 on one line",
  },
  {
    id: "eyebrow",
    label: "Eyebrow",
    hint: "CATALOG over Products",
  },
  {
    id: "quiet",
    label: "Count only",
    hint: "Drop the Products word",
  },
  {
    id: "page",
    label: "Page title",
    hint: "Current 20px heading",
  },
] as const;

export type HeadingStyle = (typeof HEADING_STYLES)[number]["id"];
