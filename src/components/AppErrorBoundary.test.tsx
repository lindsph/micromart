import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

function Boom(): ReactNode {
  throw new Error("render exploded");
}

describe("AppErrorBoundary", () => {
  it("shows a refresh path instead of a blank screen", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <AppErrorBoundary>
        <Boom />
      </AppErrorBoundary>,
    );
    expect(
      screen.getByText("Something went wrong loading this view. Refresh to try again."),
    ).toBeInTheDocument();
    spy.mockRestore();
  });
});
