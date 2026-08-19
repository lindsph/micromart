import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useDebouncedValue } from "./useDebouncedValue";

describe("useDebouncedValue", () => {
  it("holds the previous value until the delay elapses", () => {
    vi.useFakeTimers();
    const hook = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "" } },
    );

    hook.rerender({ value: "coke" });
    expect(hook.result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(299);
    });
    expect(hook.result.current).toBe("");

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(hook.result.current).toBe("coke");
    vi.useRealTimers();
  });
});
