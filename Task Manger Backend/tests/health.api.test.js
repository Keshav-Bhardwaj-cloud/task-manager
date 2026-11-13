import { describe, it, expect } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import app from "../app.js";

describe("Health Check API", () => {
  it("should return 200 for liveness", async () => {
    const response = await request(app)
      .get("/health/live");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.status).toBe("alive");
  });

  it("should return 200 when database is connected", async () => {
    const response = await request(app)
      .get("/health/ready");

    if (mongoose.connection.readyState === 1) {
      expect(response.status).toBe(200);
      expect(response.body.status).toBe("ready");
    } else {
      expect(response.status).toBe(503);
      expect(response.body.status).toBe("not_ready");
    }
  });
});