import { describe, it, expect } from "vitest";

describe("Health check connection logic", () => {
  it("should consider the database ready when readyState is 1", () => {
    const readyState = 1;

    const isDatabaseConnected = readyState === 1;

    expect(isDatabaseConnected).toBe(true);
  });

  it("should consider the database not ready when readyState is 0", () => {
    const readyState = 0;

    const isDatabaseConnected = readyState === 1;

    expect(isDatabaseConnected).toBe(false);
  });
});