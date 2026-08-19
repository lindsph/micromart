const ALLOWED_IMAGE_HOST = "res.cloudinary.com";

export type ImagePad = "none" | "matte" | "white";

/**
 * Only render https images from the catalog CDN.
 * Arbitrary imageUrl values are treated as missing — no tracking pixels,
 * javascript: URLs, or unexpected hosts.
 */
export function safeImageUrl(
  raw: string | undefined,
  displaySize: number,
  pad: ImagePad = "matte",
): string | null {
  if (!raw?.trim()) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== ALLOWED_IMAGE_HOST) {
    return null;
  }

  return withCloudinaryResize(url, displaySize, pad);
}

/**
 * Ask Cloudinary for a square thumb.
 * Pad modes letterbox onto a matching well so CSS never has to crop.
 * Fill is only for the cover-crop review option.
 */
function withCloudinaryResize(url: URL, displaySize: number, pad: ImagePad): string {
  const pixelSize = Math.min(800, Math.max(80, Math.ceil(displaySize * 2)));
  const transform =
    pad === "none"
      ? `c_fill,g_auto,w_${pixelSize},h_${pixelSize},q_auto,f_auto`
      : `c_pad,b_rgb:${pad === "white" ? "FFFFFF" : "F4F1EA"},w_${pixelSize},h_${pixelSize},q_auto,f_auto`;
  const marker = "/image/upload/";
  const index = url.pathname.indexOf(marker);
  if (index === -1) {
    return url.toString();
  }

  const after = url.pathname.slice(index + marker.length);
  const segments = after.split("/");
  const first = segments[0] ?? "";
  const firstIsTransform = /[,]|^(c_|w_|h_|q_|f_|e_)/.test(first);
  const rest = firstIsTransform ? segments.slice(1).join("/") : after;

  url.pathname = `${url.pathname.slice(0, index + marker.length)}${transform}/${rest}`;
  return url.toString();
}
