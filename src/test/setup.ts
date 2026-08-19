import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

if (typeof Element !== "undefined" && typeof Element.prototype.scrollTo !== "function") {
  Element.prototype.scrollTo = function scrollTo(
    this: Element,
    options?: ScrollToOptions | number,
    y?: number,
  ) {
    if (typeof options === "number") {
      this.scrollTop = y ?? 0;
      return;
    }
    this.scrollTop = options?.top ?? 0;
  };
}

afterEach(() => {
  cleanup();
});
