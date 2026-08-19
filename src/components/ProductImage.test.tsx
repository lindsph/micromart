import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductImage } from "./ProductImage";

describe("ProductImage", () => {
  it("falls back when the url is missing or not on the CDN", () => {
    render(
      <ProductImage
        src=""
        alt="Draft Test Product"
        name="Draft Test Product"
        category="Drink"
        tags={["Bottled Water"]}
        size={64}
        treatment="white-tile"
      />,
    );
    expect(
      screen.getByRole("img", {
        name: "Draft Test Product, package photo not on file",
      }),
    ).toBeInTheDocument();
  });

  it("renders a CDN thumb for a real pack shot", () => {
    render(
      <ProductImage
        src="https://res.cloudinary.com/demo/image/upload/v1/coke.jpg"
        alt="Coke Zero"
        name="Coke Zero"
        category="Drink"
        size={64}
        treatment="white-tile"
      />,
    );
    const image = screen.getByRole("img", { name: "Coke Zero" });
    expect(image).toHaveAttribute(
      "src",
      expect.stringContaining("res.cloudinary.com"),
    );
    expect(image).toHaveAttribute("src", expect.stringContaining("c_pad,b_rgb:FFFFFF"));
  });
});
