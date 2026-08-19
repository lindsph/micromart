import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOnlineStatus } from "./useOnlineStatus";

describe("useOnlineStatus", () => {
  it("follows browser online and offline events", () => {
    const hook = renderHook(() => useOnlineStatus());
    expect(hook.result.current).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(hook.result.current).toBe(false);

    act(() => {
      window.dispatchEvent(new Event("online"));
    });
    expect(hook.result.current).toBe(true);
  });
});
